import cv2
import numpy as np
import h5py
import tensorflow as tf
from tensorflow.keras.models import Model, load_model, Sequential
from tensorflow.keras import backend as K
from tensorflow.keras.layers import Lambda
from .preprocessor import preprocess_input


def reset_optimizer_weights(model_filename):
    """Remove optimizer weights from an hdf5 model file (if present)."""
    f = h5py.File(model_filename, 'r+')
    if 'optimizer_weights' in f:
        del f['optimizer_weights']
    f.close()


def target_category_loss(x, category_index, num_classes):
    return tf.multiply(x, K.one_hot([category_index], num_classes))


def target_category_loss_output_shape(input_shape):
    return input_shape


def normalize(x):
    # utility function to normalize a tensor by its L2 norm
    return x / (K.sqrt(K.mean(K.square(x))) + 1e-5)


def load_image(image_array):
    image_array = np.expand_dims(image_array, axis=0)
    image_array = preprocess_input(image_array)
    return image_array


def register_gradient():
    """
    Placeholder kept for API compatibility.
    Implementing true guided backprop requires rebuilding the model with
    custom ReLU gradients or use tf.custom_gradient on a cloned model.
    """
    return None


def compile_saliency_function(model, activation_layer='conv2d_7'):
    """
    Returns a function f(preprocessed_input) -> saliency_map
    where saliency_map is the absolute gradient of the max activation in activation_layer
    w.r.t. the input image (vanilla gradient / saliency map).
    """
    # get the activation layer tensor
    act_output = _get_layer_output(model, activation_layer)
    # saliency is derivative of the sum of max activations across channels w.r.t input
    saliency_model = Model(inputs=model.inputs, outputs=[act_output, model.output])

    def saliency_fn(preprocessed_input):
        inp = tf.convert_to_tensor(preprocessed_input, dtype=tf.float32)
        with tf.GradientTape() as tape:
            tape.watch(inp)
            act, preds = saliency_model(inp)
            # reduce activation to a scalar (sum of max of each channel)
            if act.shape.rank == 4:
                # act: (1, Hc, Wc, C)
                act_reduced = tf.reduce_sum(tf.reduce_max(act, axis=(1, 2)))
            else:
                act_reduced = tf.reduce_sum(act)
        grads = tape.gradient(act_reduced, inp)
        saliency = grads.numpy()
        # convert to single channel saliency map
        sal_map = np.max(np.abs(saliency), axis=-1)
        return [sal_map]

    return saliency_fn



def modify_backprop(model, name='GuidedBackProp', task=None):
    """
    API-compatible placeholder: returns the original model.
    If you need guided backprop, see notes below.
    """
    return model


def deprocess_image(x):
    """Turn a float tensor into a uint8 image for visualization."""
    if np.ndim(x) > 3:
        x = np.squeeze(x)
    x = x - x.mean()
    x = x / (x.std() + 1e-5)
    x = x * 0.1
    x = x + 0.5
    x = np.clip(x, 0, 1)
    x = x * 255
    x = np.clip(x, 0, 255).astype('uint8')
    return x

def compile_gradient_function(model, category_index, layer_name):
    """
    Returns a function that, given a preprocessed input image, computes:
      conv_output, gradients
    using tf.GradientTape (Grad-CAM style).
    The returned function has signature f(np_image) -> (conv_output_np, grads_np)
    """
    # build a model that outputs conv layer and final logits
    conv_output = _get_layer_output(model, layer_name)
    grad_model = Model(inputs=model.inputs, outputs=[conv_output, model.output])

    def gradcam_fn(preprocessed_input):
        """
        preprocessed_input: numpy array shaped (1, H, W, C)
        returns: conv_output (np array), gradients (np array)
        """
        inp = tf.convert_to_tensor(preprocessed_input, dtype=tf.float32)
        with tf.GradientTape() as tape:
            tape.watch(inp)
            conv_out, preds = grad_model(inp)
            # if model outputs logits or probabilities: pick category_index logit
            if preds.shape[-1] == 1:
                loss = preds[:, 0]
            else:
                loss = preds[:, category_index]
        # compute gradient of loss w.r.t conv_out (grad-CAM uses gradients w.r.t conv maps)
        # but we also compute gradient w.r.t conv_out directly by watching conv_out
        # For convenience compute grads of loss w.r.t conv_out:
        grads = tape.gradient(loss, conv_out)
        return conv_out.numpy(), grads.numpy()

    return gradcam_fn


def calculate_gradient_weighted_CAM(gradient_function, image, target_size=(64, 64)):
    """
    Runs the gradient_function and computes a Grad-CAM heatmap + overlay.
    image: preprocessed input (1, H, W, C)
    Returns: (overlay_image uint8, heatmap float32 [0..1])
    """
    conv_out, grads = gradient_function(image)
    conv = conv_out[0]  # Hc x Wc x channels
    grads = grads[0]    # Hc x Wc x channels

    # Global-average-pooling the gradients to get weights
    weights = np.mean(grads, axis=(0, 1))
    cam = np.zeros(conv.shape[0:2], dtype=np.float32)

    for i, w in enumerate(weights):
        cam += w * conv[:, :, i]

    cam = np.maximum(cam, 0)
    if np.max(cam) != 0:
        heatmap = cam / np.max(cam)
    else:
        heatmap = cam

    # resize heatmap to target_size (usually face box size)
    heatmap_resized = cv2.resize(heatmap.astype('float32'), target_size)
    # create color map
    cam_uint8 = np.uint8(255 * heatmap_resized)
    cam_color = cv2.applyColorMap(cam_uint8, cv2.COLORMAP_JET)

    # Recover the (preprocessed) image for overlay:
    # The input image is expected to be preprocessed; here we try to bring to [0..255]
    base = image[0].copy()
    # If it's single-channel, expand
    if base.ndim == 2:
        base = np.stack([base]*3, axis=-1)
    if base.shape[-1] == 1:
        base = np.repeat(base, 3, axis=-1)
    # normalize base into 0..255 for overlay (best-effort)
    base_min, base_max = base.min(), base.max()
    if base_max - base_min > 1e-5:
        base_vis = (base - base_min) / (base_max - base_min)
    else:
        base_vis = base
    base_vis = np.uint8(255 * base_vis)
    if cam_color.shape != base_vis.shape:
        try:
            cam_color = cv2.resize(cam_color, (base_vis.shape[1], base_vis.shape[0]))
        except Exception:
            pass

    overlay = cv2.addWeighted(cam_color.astype('uint8'), 0.5, base_vis.astype('uint8'), 0.5, 0)
    return overlay, heatmap_resized


def calculate_guided_gradient_CAM(preprocessed_input, gradient_function, saliency_function):
    """
    Return a visualization combining grad-CAM and saliency. Here we return
    deprocessed saliency for backward compatibility with demo scripts.
    """
    overlay, heatmap = calculate_gradient_weighted_CAM(gradient_function, preprocessed_input, target_size=(preprocessed_input.shape[2], preprocessed_input.shape[1]))
    saliency = saliency_function(preprocessed_input)[0]  # saliency single-channel (1, H, W)
    # deprocess and return saliency visualization (uint8)
    sal = saliency
    # normalize sal to 0..255 and return as a 2D image (or 3-channel)
    if sal.max() != sal.min():
        saln = (sal - sal.min()) / (sal.max() - sal.min())
    else:
        saln = sal * 0
    saln = np.uint8(255 * saln[0])
    sal_rgb = cv2.cvtColor(saln, cv2.COLOR_GRAY2BGR)
    return sal_rgb


def _get_layer_output(model, layer_name):
    try:
        layer = model.get_layer(layer_name)
    except ValueError:
        # Try searching layers by name substring
        for l in model.layers[::-1]:
            if layer_name in l.name:
                layer = l
                break
        else:
            raise ValueError(f"Layer '{layer_name}' not found in model.")
    return layer.output

def calculate_guided_gradient_CAM_v2(preprocessed_input, gradient_function, saliency_function, target_size=(128, 128)):
    overlay, heatmap = calculate_gradient_weighted_CAM(gradient_function, preprocessed_input, target_size=target_size)
    saliency = saliency_function(preprocessed_input)[0]
    saln = saliency
    if saln.max() != saln.min():
        saln = (saln - saln.min()) / (saln.max() - saln.min())
    else:
        saln = saln * 0
    sal_resized = cv2.resize(np.uint8(255 * saln[0]), target_size)
    sal_rgb = cv2.cvtColor(sal_resized, cv2.COLOR_GRAY2BGR)
    gradCAM = (sal_rgb * heatmap[..., np.newaxis]).astype('uint8')
    return np.expand_dims(gradCAM, -1)


if __name__ == '__main__':
    import pickle
    faces = pickle.load(open('faces.pkl', 'rb'))
    face = faces[0]
    model_filename = '../../trained_models/emotion_models/mini_XCEPTION.523-0.65.hdf5'
    # reset_optimizer_weights(model_filename)
    model = load_model(model_filename)

    preprocessed_input = load_image(face)
    predictions = model.predict(preprocessed_input)
    predicted_class = np.argmax(predictions)
    gradient_function = compile_gradient_function(
            model, predicted_class, 'conv2d_6')
    register_gradient()
    guided_model = modify_backprop(model, 'GuidedBackProp')
    saliency_function = compile_saliency_function(guided_model)
    guided_gradCAM = calculate_guided_gradient_CAM(
            preprocessed_input, gradient_function, saliency_function)

    cv2.imwrite('guided_gradCAM.jpg', guided_gradCAM)



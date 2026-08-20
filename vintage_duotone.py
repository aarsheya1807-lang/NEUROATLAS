import numpy as np
from PIL import Image, ImageOps

def apply_vintage_duotone(input_path, output_path):
    # Load image and convert to grayscale
    img = Image.open(input_path).convert('L')
    
    # Increase contrast slightly to match textbook lithograph style
    img = ImageOps.autocontrast(img, cutoff=2)
    
    # Convert pixel values to 0.0 - 1.0 range
    arr = np.array(img) / 255.0
    
    # Define Target RGB Colors
    # Deep Magenta (Shadows/Ink): #A82463 -> (168, 36, 99)
    # Off-White Cream (Highlights/Paper): #F9F5EB -> (249, 245, 235)
    magenta = np.array([168, 36, 99])
    cream = np.array([249, 245, 235])
    
    # Linear interpolation between magenta and cream based on image brightness
    result = np.zeros((arr.shape[0], arr.shape[1], 3), dtype=np.uint8)
    for i in range(3):
        result[:, :, i] = (magenta[i] * (1 - arr) + cream[i] * arr).astype(np.uint8)
    
    # Save processed image
    output_img = Image.fromarray(result)
    output_img.save(output_path)

# Example Usage
apply_vintage_duotone('input_brain.jpg', 'output_vintage_brain.png')

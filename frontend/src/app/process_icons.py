from PIL import Image
import os

def process_icons():
    source_path = 'public/icon-512.png'
    output_dir = 'public'
    
    if not os.path.exists(source_path):
        print(f"Error: {source_path} not found")
        return

    # Open the source image
    with Image.open(source_path) as img:
        # Ensure it has an alpha channel if we want to remove background, 
        # but the user wants solid white background.
        img = img.convert("RGBA")
        
        # Get bounding box of the logo to remove existing whitespace/padding
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
        
        sizes = [192, 512, 180] # 180 for apple-touch-icon
        
        for size in sizes:
            # Create a solid white background
            new_img = Image.new("RGBA", (size, size), (255, 255, 255, 255))
            
            # Calculate the logo size with 20% padding on each side (logo = 60% of total)
            logo_size_val = int(size * 0.6)
            
            # Resize the original logo maintaining aspect ratio
            w, h = img.size
            if w > h:
                new_w = logo_size_val
                new_h = int(h * (logo_size_val / w))
            else:
                new_h = logo_size_val
                new_w = int(w * (logo_size_val / h))
            
            resized_logo = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            
            # Calculate position to center the logo
            offset = ((size - new_w) // 2, (size - new_h) // 2)
            
            # Paste the logo (using the logo itself as a mask for transparency)
            new_img.paste(resized_logo, offset, resized_logo)
            
            # Convert to RGB (removing alpha) as the user wants solid white background
            final_img = new_img.convert("RGB")
            
            if size == 192:
                final_img.save(os.path.join(output_dir, 'icon-192.png'), 'PNG')
            elif size == 512:
                final_img.save(os.path.join(output_dir, 'icon-512.png'), 'PNG')
            elif size == 180:
                final_img.save(os.path.join(output_dir, 'apple-touch-icon.png'), 'PNG')
                
        # Also generate a favicon.ico from the 512 version
        with Image.open(os.path.join(output_dir, 'icon-512.png')) as icon_src:
            icon_src.save(os.path.join(output_dir, 'favicon.ico'), format='ICO', sizes=[(32, 32), (48, 48), (64, 64)])

    print("Icons processed successfully with padding and white background.")

if __name__ == "__main__":
    process_icons()

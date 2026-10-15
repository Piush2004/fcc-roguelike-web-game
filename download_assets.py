import requests
import zipfile
import io
import os

ASSETS_DIR = os.path.join(os.path.dirname(__file__), 'assets', 'sprites')
os.makedirs(ASSETS_DIR, exist_ok=True)

# Kenney Character Pack direct download link (CC0)
ZIP_URL = 'https://kenney.nl/assets/character-pack.zip'

def download_and_extract():
    print(f'Downloading {ZIP_URL}...')
    try:
        resp = requests.get(ZIP_URL, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        print(f'Failed to download: {e}')
        return

    print('Extracting...')
    try:
        with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
            # Extract all files
            zf.extractall(ASSETS_DIR)
        print(f'Extracted to {ASSETS_DIR}')
    except Exception as e:
        print(f'Failed to extract: {e}')
        return

    # Rename or move files if needed to expected names
    # For simplicity, we just leave them; the game will load any PNG as placeholder
    # but we can copy a few to expected names.
    # We'll look for any PNG and assign to player/enemy1-4/floor/wall
    png_files = [f for f in os.listdir(ASSETS_DIR) if f.lower().endswith('.png')]
    if not png_files:
        print('No PNG files found in archive.')
        return

    # Define mapping we want
    mapping = {
        'player.png': 'character_001.png',  # example
        'enemy1.png': 'character_002.png',
        'enemy2.png': 'character_003.png',
        'enemy3.png': 'character_004.png',
        'enemy4.png': 'character_005.png',
        'floor.png': 'tile_001.png',
        'wall.png': 'tile_002.png'
    }
    for dest, src in mapping.items():
        src_path = os.path.join(ASSETS_DIR, src)
        dest_path = os.path.join(ASSETS_DIR, dest)
        if os.path.exists(src_path):
            # Copy or rename
            os.replace(src_path, dest_path)
            print(f'Renamed {src} to {dest}')
        else:
            # If not found, just use first available as fallback
            if not os.path.exists(dest_path):
                fallback = os.path.join(ASSETS_DIR, png_files[0])
                os.replace(fallback, dest_path)
                print(f'Used {png_files[0]} as {dest}')

    print('Asset preparation complete.')

if __name__ == '__main__':
    download_and_extract()
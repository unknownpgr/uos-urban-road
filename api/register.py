import os
import shutil
import sqlite3
from PIL import Image
import glob

current_dir = os.path.dirname(os.path.realpath(__file__))

read_dir = os.path.join(current_dir, '../CAD files')
save_dir = os.path.join(current_dir, '../public/img/cad')
db_dir = os.path.join(current_dir, 'database.db')

if not os.path.isdir(save_dir):
    os.mkdir(save_dir)

# Delete existing files
files = glob.glob(os.path.join(save_dir, '*.png'))
for f in files:
    os.remove(f)

conn = sqlite3.connect(db_dir)
c = conn.cursor()

# Remove existing stations and sections
c.execute('DELETE FROM sections')
c.execute('DELETE FROM stations')

for src_name in os.listdir(read_dir):
    if len(src_name) < 5:
        # It doesn't seem to be an appropriate file.
        continue
    if src_name[-4:] != '.png':
        # Not a png file
        continue

    file_name = src_name[:-4]
    full_path = os.path.join(read_dir, src_name)

    shutil.copyfile(full_path, os.path.join(save_dir, src_name))

    # Get station, section, and size
    station, section = file_name.split('_')
    w, h = Image.open(full_path).size
    print(file_name, station, section, w, h)

    # Insert station.
    c.execute('INSERT OR IGNORE INTO stations VALUES(?)', (station,))

    # Insert section.
    c.execute('INSERT OR REPLACE INTO sections VALUES (?,?,?,?,?)',
              (station, section, src_name, w, h))

print('Image files successfully loaded')
c.execute('SELECT * FROM sections')
for row in c.fetchall():
    print(row)

conn.commit()
conn.close()

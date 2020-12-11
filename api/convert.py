import os
import shutil
import sqlite3
from PIL import Image

current_dir = os.path.dirname(os.path.realpath(__file__))

read_dir = os.path.join(current_dir, '../CAD files')
save_dir = os.path.join(current_dir, '../public/img/cad')
db_dir = os.path.join(current_dir, 'database.db')

if not os.path.isdir(save_dir):
    os.mkdir(save_dir)

conn = sqlite3.connect(db_dir)
c = conn.cursor()

for src_name in os.listdir(read_dir):
    if len(src_name) < 5:
        # It doesn't seem to be an appropriate file.
        continue
    if src_name[-3:] != 'png':
        # Not a png file
        continue

    file_name = src_name[:-4]
    dst_name = file_name+'.png'

    shutil.copyfile(os.path.join(read_dir, src_name),
                    os.path.join(save_dir, dst_name))

    # Frist, get station, section, and size
    station, w, h, section = file_name.split('_')

    print(file_name, station, section)

    # Second, insert station.
    c.execute('INSERT OR IGNORE INTO stations VALUES(?)', (station,))
    # Then, insert section'
    c.execute('INSERT OR IGNORE INTO sections VALUES (?,?,?,?,?)',
              (station, section, dst_name, w, h))

print('Image files successfully loaded')
c.execute('SELECT * FROM sections')
for row in c.fetchall():
    print(row)

conn.commit()
conn.close()

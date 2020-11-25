import json
from pdf2image import convert_from_path
import os
import sqlite3

current_dir = os.path.dirname(os.path.realpath(__file__))

read_dir = os.path.join(current_dir, '../CAD files')
save_dir = os.path.join(current_dir, '../public/img/cad')
if not os.path.isdir(save_dir):
  os.mkdir(save_dir)

conn = sqlite3.connect(os.path.join(current_dir, 'database.db'))
c = conn.cursor()

for pdf_file in os.listdir(read_dir):
  if len(pdf_file) < 5:
    # It doesn't seem to be an appropriate file.
    continue
  if pdf_file[-3:] != 'pdf':
    # Not a pdf file
    continue

  # Convert pdf into image and save metadata into DB
  print('Converting', pdf_file)
  file_name = pdf_file[:-4]
  img = convert_from_path(os.path.join(read_dir, pdf_file))[0]
  image_name = f'{file_name}.png'
  img.save(os.path.join(save_dir, image_name))

  # Get station and section
  station, section = file_name.split('-')

  # First, insert station.
  c.execute('INSERT OR IGNORE INTO stations VALUES(?)', (station,))
  # Then, insert section'
  c.execute('INSERT INTO sections VALUES (?,?,?,?,?)',
            (station, section, image_name, img.size[0], img.size[1]))

print('PDF files successfully converted.')
c.execute('SELECT * FROM sections')
for row in c.fetchall():
  print(row)

conn.commit()
conn.close()

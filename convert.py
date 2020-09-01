import json
from pdf2image import convert_from_path, convert_from_bytes
import os

current_dir = dir_path = os.path.dirname(os.path.realpath(__file__))

read_dir = os.path.join(current_dir, 'CAD files')
save_dir = os.path.join(current_dir, 'public/img/cad')
if not os.path.isdir(save_dir):
  os.mkdir(save_dir)

config = {}
for pdfFile in os.listdir(read_dir):
  if len(pdfFile) < 5:
    continue
  if pdfFile[-3:] != 'pdf':
    continue
  print('Converting',    pdfFile)
  path = os.path.join(read_dir, pdfFile)
  img = convert_from_path(path)[0]
  image_name = f'{pdfFile}.png'
  save_path = os.path.join(save_dir, image_name)
  img.save(save_path)
  config[pdfFile] = {'img': image_name,
                     'w': img.size[0],
                     'h': img.size[1]}

with open('public/cad_config.json', 'w') as f:
  json.dump(config, f)

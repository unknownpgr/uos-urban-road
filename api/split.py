from pdf2image import convert_from_path
import os

current_dir = os.path.dirname(os.path.realpath(__file__))

read_dir = os.path.join(current_dir, '../CAD files')
save_dir = os.path.join(current_dir, '../public/img/cad')
if not os.path.isdir(save_dir):
    os.mkdir(save_dir)

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
    imgs = convert_from_path(os.path.join(read_dir, pdf_file))

    for i in range(len(imgs)):
        image_name = f'{file_name}_{i+1}.png'
        print('Converted to :', image_name)
        imgs[i].save(os.path.join(read_dir, image_name))

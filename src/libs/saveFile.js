export function saveFile(fileName, data, type = "text/plain") {
  let file = new Blob([data], { type });
  let a = document.createElement("a");
  let url = URL.createObjectURL(file);
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(function () {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 0);
}

const mapDict = (dict, lambda) => Object.keys(dict).map((key, i) => lambda(key, dict[key], i));
const forDict = (dict, lambda) => Object.keys(dict).forEach((key, i) => lambda(key, dict[key], i));

export { mapDict, forDict };

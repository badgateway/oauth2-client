// For Node 14.x and below
if (global.btoa === undefined) {
  global.btoa = input => {
    return Buffer.from(input).toString('base64');
  };
}

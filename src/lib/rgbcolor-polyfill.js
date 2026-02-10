
function RGBColor(color) {
  this.ok = false;
  
  if (typeof color === 'string') {
    const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexMatch) {
      this.r = parseInt(hexMatch[1], 16);
      this.g = parseInt(hexMatch[2], 16);
      this.b = parseInt(hexMatch[3], 16);
      this.ok = true;
    } else {
      const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        this.r = parseInt(rgbMatch[1], 10);
        this.g = parseInt(rgbMatch[2], 10);
        this.b = parseInt(rgbMatch[3], 10);
        this.ok = true;
      }
    }
  }
  
  if (!this.ok) {
    this.r = this.g = this.b = 0;
  }
}

RGBColor.prototype.toRGB = function() {
  return 'rgb(' + this.r + ',' + this.g + ',' + this.b + ')';
};

RGBColor.prototype.toHex = function() {
  return '#' + 
    ('0' + this.r.toString(16)).slice(-2) +
    ('0' + this.g.toString(16)).slice(-2) +
    ('0' + this.b.toString(16)).slice(-2);
};

module.exports = RGBColor;
module.exports.default = RGBColor;

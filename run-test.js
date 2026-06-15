const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const Cropper = require('react-easy-crop').default;

const crop = { x: 0, y: 0 };
const zoom = 1;

// We can't render it in node because it requires DOM.

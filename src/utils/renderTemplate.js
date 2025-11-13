// src/utils/renderTemplate.js
export function renderTemplate(template = '', data = {}) {
    if (!template) return '';
    return template.replace(/\{(\w+?)\}/g, (_, key) => {
        const v = data[key];
        if (v === undefined || v === null) return '';
        return String(v);
    });
}

import { attrProps } from './attrProps'

function getPropName(attrName, elem) {
    if (attrName in elem) {
        return attrName
    } else if (attrName in attrProps) {
        return attrProps[attrName]
    } else {
        return null
    }
}

/// get value of attribute or property
function getValue(attrName, propName, elem) {
    if (!propName) {
        return elem.getAttribute(attrName)
    } else {
        let propValue = elem[propName]
        if (typeof propValue === 'number' || typeof propValue === 'boolean') {
            return propValue
        } else {
            return elem.getAttribute(attrName)
        }
    }
}

export function getProps(elem) {
    let props = elem
        .getAttributeNames()
        .map(attr => [attr, getPropName(attr, elem)])
        .map(([attr, prop]) => [prop || attr, getValue(attr, prop, elem)])
        .map(([key, value]) => {
            let name = key.indexOf('-') < 0 ? key : `"${key}"`
            return `${name}:${JSON.stringify(value)},`
        })
    return props
}

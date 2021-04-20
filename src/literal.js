import { getProps } from './getProps'

export function literal(node) {
    if (node.nodeType === document.TEXT_NODE) {
        return `textNode(${JSON.stringify(node.nodeValue)})`
    } else if (node.nodeType === document.ELEMENT_NODE) {
        //1. tagName
        let tag = node.tagName.toLowerCase()

        //2. props
        let props = getProps(node)

        //3. childNodes

        return composeDom(tag, props, node.childNodes)
    }
}

function composeDom(tag, props, children) {
    let args = []
    if (props.length > 0) {
        args.push(['{', ...props, '}'].join('\r\n'))
    }

    if (children.length > 0) {
        args.push(literalArray(children))
    }

    return tag + '(' + args.join(',') + ')'
}

export function literalArray(nodes) {
    let children = Array.from(nodes).map(node => literal(node) + ',')

    return ['[', ...children, ']'].join('\r\n')
}

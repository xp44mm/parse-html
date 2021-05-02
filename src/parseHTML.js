import { button, div, textarea, textNode } from 'hyperscript-rxjs'
import { literal, literalArray } from './literal'
import { whitespace } from './whitespace'

export function parseHTML() {
    let inp = textarea({
        placeholder: "粘贴或输入HTML",
        rows: 7,
    })
    let outp = textarea({
        readonly: "",
        rows: 14,
    })

    return div([
        inp,
        button({
            className: "btn-primary",
        }, [
            textNode("生成代码"),
        ]).subscribeEvent('click', e => {
            let wrapper = document.createElement('div')
            wrapper.innerHTML = inp.value
            wrapper.normalize()
            whitespace(wrapper)

            let literalText =
                wrapper.childNodes.length === 1
                    ? literal(wrapper.firstChild)
                    : literalArray(wrapper.childNodes)
            outp.value = literalText
            outp.select()

        }),
        outp,
    ])


}

export function parseHtmlByDom() {
    let inp = document.createElement('textarea')
    inp.setAttribute('placeholder', '粘贴或输入HTML')
    inp.setAttribute('rows', 7)

    let btn = document.createElement('button')
    btn.classList.add('btn-primary')
    btn.appendChild(document.createTextNode('生成代码'))

    let outp = document.createElement('textarea')
    outp.toggleAttribute('readonly')
    outp.setAttribute('rows', 14)

    btn.addEventListener('click', function (e) {
        let wrapper = document.createElement('div')
        wrapper.innerHTML = inp.value
        wrapper.normalize()
        whitespace(wrapper)

        let literalText =
            wrapper.childNodes.length === 1
                ? literal(wrapper.firstChild)
                : literalArray(wrapper.childNodes)
        outp.value = literalText
        outp.select()
    })

    let root = document.createElement('div')
    root.appendChild(inp)
    root.appendChild(btn)
    root.appendChild(outp)
    return root
}

import './style.css'

import { fragment } from 'hyperscript-rxjs'
import { parseHTML } from './src'

let elem = parseHTML()

document.addEventListener('DOMContentLoaded', function () {
    const root = document.getElementById('root')
    let element = elem instanceof Array ? fragment(...elem) : elem
    root.appendChild(element)
})


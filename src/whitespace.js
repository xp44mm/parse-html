//
let blockLevelFamily = new Set([
    'ADDRESS',
    'ARTICLE',
    'ASIDE',
    'BLOCKQUOTE',
    'DD',
    'DETAILS',
    'DIALOG',
    'DIV',
    'DL',
    'DT',
    'FIELDSET',
    'FIGCAPTION',
    'FIGURE',
    'FOOTER',
    'FORM',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'HEADER',
    'HGROUP',
    'HR',
    'LI',
    'MAIN',
    'NAV',
    'OL',
    'P',
    'PRE',
    'SECTION',
    'TABLE',
    'UL',
])
// developer.mozilla.org/en-US/docs/Web/HTML/Inline_elements
let inlineFamily = new Set([
    'A',
    'ABBR',
    'ACRONYM',
    'AUDIO',
    'B',
    'BDI',
    'BDO',
    'BIG',
    'BR',
    'BUTTON',
    'CANVAS',
    'CITE',
    'CODE',
    'DATA',
    'DATALIST',
    'DEL',
    'DFN',
    'EM',
    'EMBED',
    'I',
    'IFRAME',
    'IMG',
    'INPUT',
    'INS',
    'KBD',
    'LABEL',
    'MAP',
    'MARK',
    'METER',
    'NOSCRIPT',
    'OBJECT',
    'OUTPUT',
    'PICTURE',
    'PROGRESS',
    'Q',
    'RUBY',
    'S',
    'SAMP',
    'SCRIPT',
    'SELECT',
    'SLOT',
    'SMALL',
    'SPAN',
    'STRONG',
    'SUB',
    'SUP',
    'SVG',
    'TEMPLATE',
    'TEXTAREA',
    'TIME',
    'TT',
    'U',
    'VAR',
    'VIDEO',
    'WBR',
])

/**
 * Throughout, whitespace is defined as one of the characters
 *  "\t" TAB \u0009
 *  "\n" LF  \u000A
 *  "\r" CR  \u000D
 *  " "  SPC \u0020
 *
 * This does not use Javascript's "\s" because that includes non-breaking
 * spaces (and also some other characters).
 */

/// 合并重复空格
function collapseText(text = '') {
    return text.replace(/[\t\n\r ]+/g, ' ')
}

///块标签两侧，包括开标签(<div>)、闭标签(</div>)。块标签两侧的所有空白都被忽略，被剪切掉。
///块两侧可能是直接的，也可能是间接的，隔着若干非块标签。
///内联元素之间的空白，压缩成单个空格，保留第一个空白，并转化为空格。不管界限在哪里。
///最后，所有空文本节点被忽略，删除。空文本节点指的是nodeValue是类假值。
///trimStart === element.textContent.trimStart()
function whitespaceForward(element, trimStart) {
    trimStart = trimStart || blockLevelFamily.has(element.tagName)
    let cur = element.firstChild
    while (cur) {
        let nextSibling = cur.nextSibling
        if (cur.nodeType === document.TEXT_NODE) {
            if (element.firstChild.isSameNode(cur)) {
                if (trimStart) {
                    cur.nodeValue = cur.nodeValue.trimStart()
                }
            } else {
                let prev = cur.previousSibling
                if (
                    blockLevelFamily.has(prev.tagName) ||
                    /\s+$/.test(prev.textContent)
                ) {
                    cur.nodeValue = cur.nodeValue.trimStart()
                }
            }

            if (!cur.nodeValue) {
                //类假值
                element.removeChild(cur)
            }
        } else if (cur.nodeType === document.ELEMENT_NODE) {
            let hand = element.firstChild.isSameNode(cur)
                ? trimStart
                : blockLevelFamily.has(cur.previousSibling.tagName) ||
                  /\s+$/.test(cur.previousSibling.textContent)

            // Recurse down through the document
            whitespaceForward(cur, hand)
        } else {
            //删除所有其他节点类型
            element.removeChild(cur)
        }
        cur = nextSibling // Move through the child nodes
    }
}

///trimEnd === element.textContent.trimEnd()
function whitespaceBackward(element, trimEnd) {
    trimEnd = trimEnd || blockLevelFamily.has(element.tagName)
    let cur = element.lastChild
    while (cur) {
        let previousSibling = cur.previousSibling
        if (cur.nodeType === document.TEXT_NODE) {
            if (element.lastChild.isSameNode(cur)) {
                if (trimEnd) {
                    cur.nodeValue = cur.nodeValue.trimEnd()
                }
            } else if (blockLevelFamily.has(cur.nextSibling.tagName)) {
                cur.nodeValue = cur.nodeValue.trimEnd()
            }

            if (cur.nodeValue) {
                cur.nodeValue = collapseText(cur.nodeValue)
            } else {
                element.removeChild(cur)
            }
        } else if (cur.nodeType === document.ELEMENT_NODE) {
            let hand = element.lastChild.isSameNode(cur)
                ? trimEnd
                : blockLevelFamily.has(cur.nextSibling.tagName)

            // Recurse down through the document
            whitespaceBackward(cur, hand)
        } else {
        }

        cur = previousSibling // Move through the child nodes
    }
}

export function whitespace(wraper) {
    let trim = blockLevelFamily.has(wraper.tagName)
    whitespaceForward(wraper, trim)
    whitespaceBackward(wraper, trim)
}

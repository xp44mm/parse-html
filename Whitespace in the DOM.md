# Whitespace in the DOM

The presence of whitespace in the [DOM](https://developer.mozilla.org/en-US/docs/DOM) can cause layout problems and make manipulation of the content tree difficult in unforeseen ways. Any whitespace characters that are outside of tags in the original document are represented in the DOM. This is needed internally so that the editor can preserve formatting of documents and so that `white-space: pre` in [CSS](https://developer.mozilla.org/en-US/docs/CSS) will work. This means that:

- There will be some text nodes that contain only whitespace, and
- Some text nodes will have whitespace at the beginning or end.

In other words, the DOM tree for the following document will look like the image below (using "\n" to represent newlines):

```html
<!-- My document -->
<html>
<head>
  <title>My Document</title>
</head>
<body>
  <h1>Header</h1>
  <p>
    Paragraph
  </p>
</body>
</html>
```

![img](https://mdn.mozillademos.org/files/854/whitespace_tree.png)

This can make things a bit harder for any users of the DOM who want to iterate through content, excluding the whitespace.

For a deep-dive into how this can affect web layouts, read [When does white space matter in HTML?](https://patrickbrosset.com/articles/2016-10-21-when-does-white-space-matter-in-HTML.html)

## Making things easier

One may format their code as shown below to work around the problem:

```html
<!-- Conventional pretty-print
     with white spaces between tags:
 -->
<div>
 <ul>
  <li>Position 1</li>
  <li>Position 2</li>
  <li>Position 3</li>
 </ul>
</div>

<!-- Pretty-print adjusted to the issue:
 -->
<div
 ><ul
  ><li>Position 1</li
  ><li>Position 2</li
  ><li>Position 3</li
 ></ul
></div>
```


The Javascript code below defines several functions that make it easier to deal with whitespace in the DOM:

```js
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


/**
 * Determine whether a node's text content is entirely whitespace.
 *
 * @param nod  A node implementing the |CharacterData| interface (i.e.,
 *             a |Text|, |Comment|, or |CDATASection| node
 * @return     True if all of the text content of |nod| is whitespace,
 *             otherwise false.
 */
function is_all_ws( nod )
{
  // Use ECMA-262 Edition 3 String and RegExp features
  return !(/[^\t\n\r ]/.test(nod.textContent));
}


/**
 * Determine if a node should be ignored by the iterator functions.
 *
 * @param nod  An object implementing the DOM1 |Node| interface.
 * @return     true if the node is:
 *                1) A |Text| node that is all whitespace
 *                2) A |Comment| node
 *             and otherwise false.
 */

function is_ignorable( nod )
{
  return ( nod.nodeType == 8) || // A comment node
         ( (nod.nodeType == 3) && is_all_ws(nod) ); // a text node, all ws
}

/**
 * Version of |previousSibling| that skips nodes that are entirely
 * whitespace or comments.  (Normally |previousSibling| is a property
 * of all DOM nodes that gives the sibling node, the node that is
 * a child of the same parent, that occurs immediately before the
 * reference node.)
 *
 * @param sib  The reference node.
 * @return     Either:
 *               1) The closest previous sibling to |sib| that is not
 *                  ignorable according to |is_ignorable|, or
 *               2) null if no such node exists.
 */
function node_before( sib )
{
  while ((sib = sib.previousSibling)) {
    if (!is_ignorable(sib)) return sib;
  }
  return null;
}

/**
 * Version of |nextSibling| that skips nodes that are entirely
 * whitespace or comments.
 *
 * @param sib  The reference node.
 * @return     Either:
 *               1) The closest next sibling to |sib| that is not
 *                  ignorable according to |is_ignorable|, or
 *               2) null if no such node exists.
 */
function node_after( sib )
{
  while ((sib = sib.nextSibling)) {
    if (!is_ignorable(sib)) return sib;
  }
  return null;
}

/**
 * Version of |lastChild| that skips nodes that are entirely
 * whitespace or comments.  (Normally |lastChild| is a property
 * of all DOM nodes that gives the last of the nodes contained
 * directly in the reference node.)
 *
 * @param sib  The reference node.
 * @return     Either:
 *               1) The last child of |sib| that is not
 *                  ignorable according to |is_ignorable|, or
 *               2) null if no such node exists.
 */
function last_child( par )
{
  var res=par.lastChild;
  while (res) {
    if (!is_ignorable(res)) return res;
    res = res.previousSibling;
  }
  return null;
}

/**
 * Version of |firstChild| that skips nodes that are entirely
 * whitespace and comments.
 *
 * @param sib  The reference node.
 * @return     Either:
 *               1) The first child of |sib| that is not
 *                  ignorable according to |is_ignorable|, or
 *               2) null if no such node exists.
 */
function first_child( par )
{
  var res=par.firstChild;
  while (res) {
    if (!is_ignorable(res)) return res;
    res = res.nextSibling;
  }
  return null;
}

/**
 * Version of |data| that doesn't include whitespace at the beginning
 * and end and normalizes all whitespace to a single space.  (Normally
 * |data| is a property of text nodes that gives the text of the node.)
 *
 * @param txt  The text node whose data should be returned
 * @return     A string giving the contents of the text node with
 *             whitespace collapsed.
 */
function data_of( txt )
{
  var data = txt.textContent;
  // Use ECMA-262 Edition 3 String and RegExp features
  data = data.replace(/[\t\n\r ]+/g, " ");
  if (data.charAt(0) == " ")
    data = data.substring(1, data.length);
  if (data.charAt(data.length - 1) == " ")
    data = data.substring(0, data.length - 1);
  return data;
}
```

## Example

The following code demonstrates the use of the functions above. It iterates over the children of an element (whose children are all elements) to find the one whose text is `"This is the third paragraph"`, and then changes the class attribute and the contents of that paragraph.

```js
var cur = first_child(document.getElementById("test"));
while (cur)
{
  if (data_of(cur.firstChild) == "This is the third paragraph.")
  {
    cur.className = "magic";
    cur.firstChild.textContent = "This is the magic paragraph.";
  }
  cur = node_after(cur);
}
```

# When does white space matter in HTML?

As a web developer, you don't often spend time thinking about white space, right? I mean, how often do they actually matter?

Well, hopefully with this article, you'll think of them more often, or at least will know when they do matter and know how to track them down!

## What is white space?

White space is any string of text composed only of spaces, tabs or line breaks (to be precise, either CRLF sequences, carriage returns or line feeds).

As someone who writes code, you probably know the vital importance of these characters. They allow you to format your code in a way that will make it easily readable by yourself and other people. In fact much of our source code is full of these white space characters (that is, unless you write obfuscated code). They're most often used for breaking the code on multiple lines and indenting lines to represent the nesting of elements.

But, because these characters are important for people who read the code doesn't mean they're important for people who visit your web page. These formatting-only characters wouldn't look too good if they did impact the layout of your page, right?

Let's take a simple example:

```html
<!DOCTYPE html>
    <h1>   Hello World! </h1>
```

This source code contains a line feed after the DOCTYPE and a bunch of space characters before and inside the h1 tag, but the browser doesn't seem to care at all and just shows the words *Hello World!* as if these characters didn't exist at all!

![img](https://patrickbrosset.com/articles/assets/medium-import/8HMhC1n8AXXOAeyMmqUSSw.png)


Unlike a word processing application, the browser seems to completely ignore white spaces (most of the time at least).

## How does CSS process white spaces?

If most white space characters are ignored, not all of them are. In the previous example the space between *Hello* and *World!* still exists when the page is rendered in a browser. So there must be something in the browser engine that decides which white space characters are useful and which aren't.

If you're the kind of person who likes reading specifications, you might like the [CSS Text Module Level 3 spec](https://www.w3.org/TR/css-text-3), and especially the parts about the [CSS white-space property](https://www.w3.org/TR/css-text-3/#white-space-property) and [white space processing details](https://www.w3.org/TR/css-text-3/#white-space-processing), but then again, if you're that type of person, you're probably not reading this article right now.

Let's take another really simple example (to make it easy, I've illustrated all spaces with ◦, all tabs with ⇥ and all line breaks with ⏎):

```html
<h1>◦◦◦Hello◦⏎
⇥⇥⇥⇥<span>◦World!</span>⇥◦◦</h1>
```

That's how this example markup is rendered in a browser:

![img](https://patrickbrosset.com/articles/assets/medium-import/8HMhC1n8AXXOAeyMmqUSSw.png)



The h1 element contains only inline elements. In fact it contains a text node (consisting of some spaces, the word *Hello* and some tabs), an inline element (the span, which contains a space, and the word *World!*) and another text node (consisting only of tabs and spaces).

Because of this, it establishes what is called an [inline formatting context](https://www.w3.org/TR/CSS21/visuren.html#inline-formatting). This is one of the possible layout rendering contexts that browser engines work with.

Inside this context, white space characters are processed as followed (this is overly simplified, the specification goes into much more details):

- first, all spaces and tabs immediately before and after a line break are ignored. so, if we take our example markup from before and apply this first rule, we get:

```html
<h1>◦◦◦Hello⏎
<span>◦World!</span>⇥◦◦</h1>
```

- then, all tab characters are handled as space characters, so the example becomes:

```html
<h1>◦◦◦Hello⏎
<span>◦World!</span>◦◦◦</h1>
```

- next, line breaks are converted to spaces:

```html
<h1>◦◦◦Hello◦<span>◦World!</span>◦◦◦</h1>
```

- then, any space immediately following another space (even across two separate inline elements) is ignored, so we end up with:

```html
<h1>◦Hello◦<span>World!</span>◦</h1>
```

- and finally, sequences of spaces at the beginning and end of a line are removed, so we finally get this:

```html
<h1>Hello◦<span>World!</span></h1>
```

Which is why people visiting the web page will simply see the phrase *Hello World!* nicely written at the top of the page, rather than a weirdly indented *Hello* followed but an even more weirdly indented *World!* on the line below that.

![img](https://patrickbrosset.com/articles/assets/medium-import/lx56kLIuWir6-iDEI57shA.png)

Visitors would see the rendering on the left, not the one on the right.

In fact, using [Firefox DevTools](https://developer.mozilla.org/en-US/docs/Tools) (since version 52 which now supports highlighting text nodes), you can see how the space separating the 2 words is part of the node that contains *Hello* just like the markup we ended up with after applying the white space processing rules:

```html
<h1>Hello◦<span>World!</span></h1>
```

![img](https://patrickbrosset.com/articles/assets/medium-import/hNSUVhhTZDvu6-B7DlQ06w.gif)

Highlighting the word Hello shows that the only remaining space in the h1 element is part of this text node.

Now we know how white space is processed within an inline formatting context (which, remember, is basically an element that contains only inline elements).

You might be wondering how white space is processed in other types of contexts and what these contexts even are.

Well, if an element contains at least one block element, then it establishes what is called a [block formatting context](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Block_formatting_context)!

Within this context, white space is treated very differently. Let's take a look at this example:

```html
<body>⏎
⇥<div>◦◦Hello◦◦</div>⏎
⏎
◦◦◦<div>◦◦World!◦◦</div>◦◦⏎
</body>
```

We have 3 text nodes in there that contain only white spaces, one before the first div, one between the 2 divs, and one after the second div.

Browser engines may be optimizing this differently, but for the sake of understanding, I'll go with the following explanation:

Because we're inside a block formatting context, everything must be a block, so our 3 text nodes also become blocks, just like the 2 divs.

Blocks occupy the full width available and are stacked on top of each other, which means that we end up with a layout composed of this list of blocks:

```html
<block>⏎⇥</block>
<block>◦◦Hello◦◦</block>
<block>⏎◦◦◦</block>
<block>◦◦World!◦◦</block>
<block>◦◦⏎</block>
```

We can simplify it further by applying the processing rules for white space in inline formatting contexts:

```html
<block></block>
<block>Hello</block>
<block></block>
<block>World!</block>
<block></block>
```

The 3 empty blocks we now have are just not going to occupy any space in the final layout, because they just don't contain anything, so we'll indeed end up positioning 2 blocks in the page only. And people viewing the web page will see the words *Hello* and then *World!* on 2 separate lines as you'd expect 2 divs to be laid out.

So in this case, the browser engine has essentially ignored all of the white space that was added in the source code.

![img](https://patrickbrosset.com/articles/assets/medium-import/qrp3VcKiYZEBVJ-hZ4CNLQ.gif)

Two block elements laid out on top of each other, with all the white space ignored.

## Why don't we see white spaces in devtools?

We've seen in the previous section how white space was often ignored when rendering the layout, but we've said that it still played a role in the DOM tree. Text nodes are still being created in the DOM tree of the page, so the following code:

```html
<body>⏎
⇥<div>◦◦Hello◦◦</div>⏎
⏎
◦◦◦<div>◦◦World!◦◦</div>◦◦⏎
</body>
```

still generates the following tree:

```html
element node: <body>
    ∟ text node: ⏎⇥ 
    ∟ element node: div
        ∟ text node: ◦◦Hello◦◦
    ∟ text node: ⏎⏎◦◦◦
    ∟ element node: div
        ∟ text node: ◦◦World!◦◦
    ∟ text node: ◦◦⏎
```

And the primary job of any inspector panel in any devtools out there is to display the DOM tree, but if you try for yourself, you'll see that these text nodes are just not there.

![img](https://patrickbrosset.com/articles/assets/medium-import/psIbuiT-ckAHBBGr8F0m5g.png)

Text nodes are ignored in Firefox

![img](https://patrickbrosset.com/articles/assets/medium-import/i7luPjjD1x7M5oWVXpYnVA.png)

And also ignored in Chrome

The reason being that if the browser engine ignores these white space only text nodes when creating the layout, then it's probably safe for devtools to ignore them too. After all, authors only use them for formatting, and visitors don't see them. So there's no real need for devtools to show them.

Now, there are in fact cases where showing white space text nodes in devtools could be useful. The following sections will describe what they are.

## Spaces between inline and inline-block elements

In fact, we've seen this already with the very first example in this article, when we described how white space was processed inside inline formatting contexts.

We said that there were rules to ignore most characters but that certain spaces staid in order to, basically, separate words.

So, when you're actually dealing with text only, paragraphs that may contain inline elements such as em, strong, span, etc. you don't normally care about this because the extra white spaces that do make it to the layout are actually helpful to separate the words.

But it gets more interesting when you start using inline-block elements. These elements appear as inline elements from the outside, but behave like blocks on the inside, so they are very often used to display more complex pieces of UI than just text side by side on the same line (just like if you floated blocks).

I think the expectation from web developers is that because they are blocks, they will behave as such, and just stack side by side (rather than on top of each other), but really they don't. If there is formatting white space in the markup between them, then that will create space in the layout just like between text.

Consider this example:

```css
.people-list { 
    list-style-type: none; 
    margin: 0; 
    padding: 0; 
}

.people-list li { 
    display: inline-block;
    width: 2em;
    height: 2em;
    background: #f06;
    border: 1px solid;
}
```

```html
<ul class="people-list">⏎
◦◦<li></li>⏎
◦◦<li></li>⏎
◦◦<li></li>⏎
◦◦<li></li>⏎
◦◦<li></li>⏎
</ul>
```

If you open this in a browser, you'll see the following result:

![img](https://patrickbrosset.com/articles/assets/medium-import/_OCThEatQqzndeqgJN9Fzw.png)

Which is most probably not what you intended. Let's assume this is a list of people's avatars and you wanted them displayed like this instead:

![img](https://patrickbrosset.com/articles/assets/medium-import/Vly3EOAPmBSsupOQsT_Nzw.png)

Well, this is a very common CSS layout problem and [questions](http://stackoverflow.com/questions/5078239/how-to-remove-the-space-between-inline-block-elements) and [articles](https://css-tricks.com/fighting-the-space-between-inline-block-elements/) have been written about this. There exist solutions, things like getting rid of the white space altogether, setting your font-size to 0, or using negative margin, etc.

What is interesting here isn't really the solution to this common problem, but the fact that this is a common problem at all, and that many web developers have spent at least a little bit of time confronted to.

Suddenly white space does show up in your layout in a way you didn't expect and it may take you a while to figure out the problem.

Because the corresponding text nodes aren't in devtools, people loose time on this common problem if they haven't faced it before. They'll check if there is margin somewhere but won't find any.

So that's one example of when showing white space text nodes in devtools would actually be useful. Let's see another one.

## Controlling white space rendering

Using the CSS `white-space` property, you can control how white space characters are processed when a given inline formatting context is laid out.

css-tricks.com has [a nice article about this property](https://css-tricks.com/almanac/properties/w/whitespace/).

The important thing is that if you set this property to `pre`, `pre-wrap` or `pre-line`, this will actually honor some or all of the white space character in the source HTML code, and they will start taking space in the layout.

If we take a simple example from earlier:

```html
<h1>◦◦◦Hello◦⏎
⇥⇥⇥⇥<span>◦World!</span>⇥◦◦</h1>
```

But add the following CSS rule:

```css
h1 { white-space: pre; }
```

We then end up with the following layout:

![img](https://patrickbrosset.com/articles/assets/medium-import/Dz-vnOLt_eG0vweIkaJMoQ.gif)

Using Firefox DevTools to highlight text nodes, you can see exactly what space is occupied by the “Hello” text node.

As you can see above, the layout inside the h1 element respects the formatting of the source HTML file. There is some space before the word *Hello*, then a line break, then more space and the word *World!*.

In fact, as you can see, the first node shown in devtools inside the h1 element is a text node and hovering over it does highlight the space taken by that node in the page.

Hovering over the span element also highlights the space taken in the page, and in particular, you can see the space before the word *World!* coming from:

```html
<span>◦World!</span>
```

Therefore, that's a second reason why devtools should show white space text nodes. Indeed, someone trying to understand the layout and not knowing about the *white-space* property may be confused.

## Firefox DevTools to the rescue!

Starting with version 52 of Firefox, [the inspector panel shows white space text nodes](https://blog.nightly.mozilla.org/2016/10/17/devtools-now-display-white-space-text-nodes-in-the-dom-inspector/) when they do have an impact on the layout and also highlights them in the page.

How does the inspector know when a node impacts the layout? It simply checks if that white space text node has a size. When a text node is ignored, it'll have a width and height of 0, but when it participate in the layout, it'll have some dimension.

So, using this simple heuristic, Firefox DevTools can show the white space text nodes that are important.

![img](https://patrickbrosset.com/articles/assets/medium-import/FxrkWgJ9axNWk-BdvZyHbQ.gif)

White space text nodes displayed in the inspector and highlighted in the page.

As you can see above, the white space text nodes that do have a size in the page are now shown in the inspector panel and, if you hover over them, they are also highlighted in the page so you know exactly where they are and how big they are.

This way, if you were originally confused about why the avatars in the page didn't sit next to each other, it will now be very obvious why that is. No more loosing time looking for margins that aren't there or crafting the right google search query that will give you the answer.

In fact, you can even remove these text nodes and see that the inline-block elements are now displayed exactly as you wanted them to.

![img](https://patrickbrosset.com/articles/assets/medium-import/lDvyOw-qUrt8S9KHPlV3WQ.gif)

Deleting white space text nodes.

Hopefully this new feature and this article have been helpful, thanks for reading!
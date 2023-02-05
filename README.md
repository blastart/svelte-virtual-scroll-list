# @blastart/svelte-virtual-scroll-list

[![npm](https://img.shields.io/npm/v/svelte-virtual-scroll-list?style=for-the-badge)](https://npmjs.com/package/svelte-virtual-scroll-list/)

Svelte implementation of vue library [vue-virtual-scroll-list](https://github.com/tangbc/vue-virtual-scroll-list) with **HTML TABLE** support.

Original Svelte fork: [v1ack/svelte-virtual-scroll-list](https://github.com/v1ack/svelte-virtual-scroll-list/tree/master/example)

Virtualized scrolling for big lists

---
**Support dynamic both-directional lists** and Tables (see example)

---

Online demo: [https://blastart.github.io/svelte-virtual-scroll-list/](https://v1ack.github.io/svelte-virtual-scroll-list/)

[~~Simple example in Svelte REPL~~](https://)

# Getting started

## Installing from npm

`npm i @blastart/svelte-virtual-scroll-list -D`

or

`yarn add @blastart/svelte-virtual-scroll-list -D`

## Using

```html

<script>
    import VirtualScroll from "svelte-virtual-scroll-list"

    let items = [{id: 1, text: "one"}, ...]
</script>
<div class="vs">
    <VirtualScroll
            data={items}
            key="id"
            let:data
    >
        <div slot="empty">
            no item to display
        </div>
        <div slot="header">
            This is a header set via slot
        </div>
        <div>
            {data.text}
        </div>
        <div slot="footer">
            This is a footer set via slot
        </div>
    </VirtualScroll>
</div>
```
## as Html table
```html
<script>
    import VirtualScroll from "svelte-virtual-scroll-list"

    let items = [
        {id: 1, value1: 'content 1', value2: 'content 2', value3: 'content 3'  },
        ...
    ]
    let cells = [
        { label: 'col one', width: 100, name: 'value1' },
        { label: 'col two', width: 134, name: 'value2' },
        { label: 'col three', width: null, name: 'value3' }
    ]
</script>
<div class="vs">
    <VirtualScroll
            data={items}
            key="id"
            tableView={true}
            let:data
            pageMode={true}
    >
        <!-- empty text -->
        <th slot="empty" colspan={cells.length}>
            <div style="padding: 2em; text-align: center;">No items</div>
        </th>
        <!-- thead rows -->
        <tr slot="header">
            {#each cells as cell}
                <th style:width={cell.width ? `${cell.width}px` : null}>
                    <div class="cell-inner">{cell.label}</div>
                </th>
            {/each}
        </tr>
        <!-- tbody rows -->
        {#each cells as cell (cell.prop)}
            <td>
                <div class="cell-inner">
                    {data[cell.prop]}
                </div>
            </td>
        {/each}
        <!-- tbody rows -->
        <tr slot="footer">
            <th colspan={cells.length}>This is a footer set via slot</th>
        </tr>
    </VirtualScroll>
    <style>
    .vs{
        height: auto;
        max-width: none;
    }
    .cell-inner {
        padding: 10px 5px;
        box-sizing: border-box;
    }
    </style>
</div>
```

More examples available in `example` folder

# Comparing to other virtualizing components

| |@blastart/svelte-virtual-scroll-list|svelte-virtual-scroll-list|svelte-virtual-list|svelte-tiny-virtual-list|
|---|---|---|---|---|
|handle dynamic size data|+|+|+|-|
|scroll methods (to index)|+|+|-|+|
|infinity scrolling|two-directional|two-directional|-|one-directional with another lib|
|initial scroll position|+|+|-|+|
|sticky items|+|-|-|+|
|top/bottom slots|+|+|-|+|
|reached top/bottom events|+|+|-|-|
|document as a list|+|+|-|-|
|dynamic viewport filling|+|-|?|?
|adjusts the average size after scrolling|+|-|?|?
|support tables|+|-|-|-

# API

## Props

|prop|type|default|description|
|---|---|---|---|
|data|object[]|`null`|Source for list|
|key|string|`id`|Unique key for getting data from `data`|
|*nameSpace|string|virtual-scroll|css BEM / event namespacing|
|keeps|number|`30`|Count of rendered items|
|keepsBehaviour|string|as-is| **"as-is"** - uses the value set in params.<br /><br /> "**auto-increase**" - increments the value set in param.keeps until the rendered range becomes larger than the viewport.<br /><br /> "**auto-adjust**" - Increments/decrements the value set in params according to the size of the viewport. This may cause more rendering cycles, especially for non-fixed size elements, but it always renders a sufficient number of elements to fill the viewport <br /><br />"**accurate**" - Renders an exact number of items to fill the viewport in each range changes. This is the most accurate option but it casuses more re-renders than the other options.|
|*fillMaxSize|number|`undefined`| Maximum fill height, prevents infinite cycles if the parent element has no height set|
|*fillSizeMultiplier|boolean|2|Viewport multiplier. According to keepsBehavior, it increases the size of the viewport to be filled with elements in order to ensure smooth scrolling even when scrolling fast. The value of "keeps" increases in proportion to the viewport.|
|*estimateSize|number \|<br />`(uniqueKey) => number`|50|Estimate size of each item, needs for smooth scrollbar.|
|*buffer|number|undefined|items to render in addition to the keeps. Recommend for a third of keeps, but it is **strongly recommended to leave undefined**, because it will be calculated automatically from the value of keeps.|
|*slotHeaderSize|number|`undefined`| size of the header slot|
|*slotFooterSize|number|`undefined`| size of the footer slot|
|*autoAutoUpdateAverageSize|boolean|true|update the average size of items after each scroll|
|isHorizontal|boolean|`false`|Scroll direction|
|*tableView|boolean|false|\<Table \/> view|
|pageMode|boolean|`false`|Let virtual list using global document to scroll through the list|
|start|number|`0`|scroll position start index|
|*~~offset~~ scrollPos|number|`0`|scroll position|
|topThreshold|number|`0`|The threshold to emit `top` event, attention to multiple calls.|
|bottomThreshold|number|`0`|The threshold to emit `bottom` event, attention to multiple calls.|
|*propsRoot|<code>{className: '', tagName: "section", ...etc}</code>|{}|Props of root element|
|*propsList|<code>{className: '', tagName: "section", ...etc}</code>|{}|Props of list element|
|*propsItem|<code>{className: '', tagName: "section", ...etc}</code>|{}|Props of item element|
|*propsHeaderSlot|<code>{className: '', tagName: "section", ...etc}</code>|{}|Pros for the Item in the header slot
|*propsFooterSlot|<code>{className: '', tagName: "section", ...etc}</code>|{}|Pros for the Item in the footer slot
|*<br />wrapperStyle,  <br />rootStyle, <br />listStyle,  <br />itemStyle, <br />headerSlotStyle, <br />footerSlotStyle|<pre>(<br /> viewModes: {<br />  tableView: boolean, <br />  isHorizontal: boolean, <br />  pageMode: boolean<br />}, <br /> range: TypeRange<br />) => string</pre>|view in source| should return a css string to override the style of the desired element.|
|*debug|<code>boolean \| {efficiency: 0\|1\|2, info: 0\|1\|2, logErrors: boolean}</code>|false|for more info see virtual.js/TypeDebugOptions|


<br />
<br />

## Methods
Access to methods by component binding
<details>
<summary>Binding example</summary>

```html

<script>
    let vs
</script>

<VirtualScroll bind:this={vs}></VirtualScroll>
<button on:click={vs.scrollToBottom}>To bottom</button>
```

</details>

|method|arguments|description|
|---|---|---|
|scrollToBottom|`none`|Scroll list to bottom|
|scrollToIndex|`index: number`|Set scroll position to a designated index|
|*triggerScroll|`none`|Trigger a scroll event
|scrollTo|`position: number`|Set scroll to a designated position|
|*scrollToRelative|`position: number`| Set scroll to a designated position relative to the page offset
|getSize|`id: typeof props.key`|Get the designated item size|
|getSizes|`none`|Get the total number of stored (rendered) items|
|resetSizes|`none`|Reset calculated size valus|
|*~~getOffset~~ getScrollPos|`none`|Get current scroll position|
|getClientSize|`none`|Get wrapper element client viewport size (width or height)|
|getScrollSize|`none`|Get all scroll size (scrollHeight or scrollWidth)|
|updatePageModeFront|`none`|When using page mode and virtual list root element offsetTop or offsetLeft change, you need call this method manually|

##Styles




## Events

|event|description|
|---|---|
|scroll|Scroll event|
|top|Top of the list reached|
|bottom|Bottom of the list reached|

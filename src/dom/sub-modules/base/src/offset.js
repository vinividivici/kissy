/**
 * @ignore
 * dom-offset
 * @author lifesinger@gmail.com, yiminghe@gmail.com
 */
KISSY.add('dom/base/offset', function (S, DOM, undefined) {

        var win = S.Env.host,
            doc = win.document,
            NodeType = DOM.NodeType,
            docElem = doc && doc.documentElement,
            getWin = DOM.getWindow,
            CSS1Compat = 'CSS1Compat',
            compatMode = 'compatMode',
            MAX = Math.max,
            myParseInt = parseInt,
            POSITION = 'position',
            RELATIVE = 'relative',
            DOCUMENT = 'document',
            BODY = 'body',
            DOC_ELEMENT = 'documentElement',
            OWNER_DOCUMENT = 'ownerDocument',
            VIEWPORT = 'viewport',
            SCROLL = 'scroll',
            CLIENT = 'client',
            LEFT = 'left',
            TOP = 'top',
            isNumber = S.isNumber,
            SCROLL_LEFT = SCROLL + 'Left',
            SCROLL_TOP = SCROLL + 'Top';

        S.mix(DOM,
            /**
             * @override KISSY.DOM
             * @class
             * @singleton
             */
            {

                /**
                 * Get the current coordinates of the first element in the set of matched elements, relative to the document.
                 * or
                 * Set the current coordinates of every element in the set of matched elements, relative to the document.
                 * @param {HTMLElement[]|String|HTMLElement} selector Matched elements
                 * @param {Object} [coordinates ] An object containing the properties top and left,
                 * which are integers indicating the new top and left coordinates for the elements.
                 * @param {Number} [coordinates.left ] the new top and left coordinates for the elements.
                 * @param {Number} [coordinates.top ] the new top and top coordinates for the elements.
                 * @param {window} [relativeWin] The window to measure relative to. If relativeWin
                 *     is not in the ancestor frame chain of the element, we measure relative to
                 *     the top-most window.
                 * @return {Object|undefined} if Get, the format of returned value is same with coordinates.
                 */
                offset: function (selector, coordinates, relativeWin) {
                    // getter
                    if (coordinates === undefined) {
                        var elem = DOM.get(selector), ret;
                        if (elem) {
                            ret = getOffset(elem, relativeWin);
                        }
                        return ret;
                    }
                    // setter
                    var els = DOM.query(selector), i;
                    for (i = els.length - 1; i >= 0; i--) {
                        elem = els[i];
                        setOffset(elem, coordinates);
                    }
                    return undefined;
                },

                /**
                 * scrolls the first of matched elements into container view
                 * @param {HTMLElement[]|String|HTMLElement} selector Matched elements
                 * @param {String|HTMLElement|HTMLDocument} [container=window] Container element
                 * @param {Boolean|Object} [alignWithTop=true]If true, the scrolled element is aligned with the top of the scroll area.
                 * If false, it is aligned with the bottom.
                 * @param {Boolean} [alignWithTop.allowHorizontalScroll=true] Whether trigger horizontal scroll.
                 * @param {Boolean} [alignWithTop.onlyScrollIfNeeded=false] scrollIntoView when element is out of view
                 * and set top to false or true automatically if top is undefined
                 * @param {Boolean} [allowHorizontalScroll=true] Whether trigger horizontal scroll.
                 * refer: http://www.w3.org/TR/2009/WD-html5-20090423/editing.html#scrollIntoView
                 *        http://www.sencha.com/deploy/dev/docs/source/Element.scroll-more.html#scrollIntoView
                 *        http://yiminghe.javaeye.com/blog/390732
                 */
                scrollIntoView: function (selector, container, alignWithTop, allowHorizontalScroll) {
                    var elem,
                        onlyScrollIfNeeded;

                    if (!(elem = DOM.get(selector))) {
                        return;
                    }

                    if (container) {
                        container = DOM.get(container);
                    }

                    if (!container) {
                        container = elem.ownerDocument;
                    }

                    // document 归一化到 window
                    if (container.nodeType == NodeType.DOCUMENT_NODE) {
                        container = getWin(container);
                    }

                    if (S.isPlainObject(alignWithTop)) {
                        allowHorizontalScroll = alignWithTop.allowHorizontalScroll;
                        onlyScrollIfNeeded = alignWithTop.onlyScrollIfNeeded;
                        alignWithTop = alignWithTop.alignWithTop;
                    }

                    allowHorizontalScroll = allowHorizontalScroll === undefined ? true : allowHorizontalScroll;

                    var isWin = !!getWin(container),
                        elemOffset = DOM.offset(elem),
                        eh = DOM.outerHeight(elem),
                        ew = DOM.outerWidth(elem),
                        containerOffset,
                        ch,
                        cw,
                        containerScroll,
                        diffTop,
                        diffBottom,
                        win,
                        winScroll,
                        ww,
                        wh;

                    if (isWin) {
                        win = container;
                        wh = DOM.height(win);
                        ww = DOM.width(win);
                        winScroll = {
                            left: DOM.scrollLeft(win),
                            top: DOM.scrollTop(win)
                        };
                        // elem 相对 container 可视视窗的距离
                        diffTop = {
                            left: elemOffset[LEFT] - winScroll[LEFT],
                            top: elemOffset[TOP] - winScroll[TOP]
                        };
                        diffBottom = {
                            left: elemOffset[LEFT] + ew - (winScroll[LEFT] + ww),
                            top: elemOffset[TOP] + eh - (winScroll[TOP] + wh)
                        };
                        containerScroll = winScroll;
                    }
                    else {
                        containerOffset = DOM.offset(container);
                        ch = container.clientHeight;
                        cw = container.clientWidth;
                        containerScroll = {
                            left: DOM.scrollLeft(container),
                            top: DOM.scrollTop(container)
                        };
                        // elem 相对 container 可视视窗的距离
                        // 注意边框 , offset 是边框到根节点
                        diffTop = {
                            left: elemOffset[LEFT] - (containerOffset[LEFT] +
                                (myParseInt(DOM.css(container, 'borderLeftWidth')) || 0)),
                            top: elemOffset[TOP] - (containerOffset[TOP] +
                                (myParseInt(DOM.css(container, 'borderTopWidth')) || 0))
                        };
                        diffBottom = {
                            left: elemOffset[LEFT] + ew -
                                (containerOffset[LEFT] + cw +
                                    (myParseInt(DOM.css(container, 'borderRightWidth')) || 0)),
                            top: elemOffset[TOP] + eh -
                                (containerOffset[TOP] + ch +
                                    (myParseInt(DOM.css(container, 'borderBottomWidth')) || 0))
                        };
                    }

                    if (onlyScrollIfNeeded) {
                        if (diffTop.top < 0 || diffBottom.top > 0) {
                            // 强制向上
                            if (alignWithTop === true) {
                                DOM.scrollTop(container, containerScroll.top + diffTop.top);
                            } else if (alignWithTop === false) {
                                DOM.scrollTop(container, containerScroll.top + diffBottom.top);
                            } else {
                                // 自动调整
                                if (diffTop.top < 0) {
                                    DOM.scrollTop(container, containerScroll.top + diffTop.top);
                                } else {
                                    DOM.scrollTop(container, containerScroll.top + diffBottom.top);
                                }
                            }
                        }
                    } else {
                        alignWithTop = alignWithTop === undefined ? true : !!alignWithTop;
                        if (alignWithTop) {
                            DOM.scrollTop(container, containerScroll.top + diffTop.top);
                        } else {
                            DOM.scrollTop(container, containerScroll.top + diffBottom.top);
                        }
                    }

                    if (allowHorizontalScroll) {
                        if (onlyScrollIfNeeded) {
                            if (diffTop.left < 0 || diffBottom.left > 0) {
                                // 强制向上
                                if (alignWithTop === true) {
                                    DOM.scrollLeft(container, containerScroll.left + diffTop.left);
                                } else if (alignWithTop === false) {
                                    DOM.scrollLeft(container, containerScroll.left + diffBottom.left);
                                } else {
                                    // 自动调整
                                    if (diffTop.left < 0) {
                                        DOM.scrollLeft(container, containerScroll.left + diffTop.left);
                                    } else {
                                        DOM.scrollLeft(container, containerScroll.left + diffBottom.left);
                                    }
                                }
                            }
                        } else {
                            alignWithTop = alignWithTop === undefined ? true : !!alignWithTop;
                            if (alignWithTop) {
                                DOM.scrollLeft(container, containerScroll.left + diffTop.left);
                            } else {
                                DOM.scrollLeft(container, containerScroll.left + diffBottom.left);
                            }
                        }
                    }
                },

                /**
                 * Get the width of document
                 * @param {window} [win=window] Window to be referred.
                 * @method
                 */
                docWidth: 0,
                /**
                 * Get the height of document
                 * @param {window} [win=window] Window to be referred.
                 * @method
                 */
                docHeight: 0,
                /**
                 * Get the height of window
                 * @param {window} [win=window] Window to be referred.
                 * @method
                 */
                viewportHeight: 0,
                /**
                 * Get the width of document
                 * @param {window} [win=window] Window to be referred.
                 * @method
                 */
                viewportWidth: 0,
                /**
                 * Get the current vertical position of the scroll bar for the first element in the set of matched elements.
                 * or
                 * Set the current vertical position of the scroll bar for each of the set of matched elements.
                 * @param {HTMLElement[]|String|HTMLElement|window} selector matched elements
                 * @param {Number} value An integer indicating the new position to set the scroll bar to.
                 * @method
                 */
                scrollTop: 0,
                /**
                 * Get the current horizontal position of the scroll bar for the first element in the set of matched elements.
                 * or
                 * Set the current horizontal position of the scroll bar for each of the set of matched elements.
                 * @param {HTMLElement[]|String|HTMLElement|window} selector matched elements
                 * @param {Number} value An integer indicating the new position to set the scroll bar to.
                 * @method
                 */
                scrollLeft: 0
            });

// http://old.jr.pl/www.quirksmode.org/viewport/compatibility.html
// http://www.quirksmode.org/dom/w3c_cssom.html
// add ScrollLeft/ScrollTop getter/setter methods
        S.each(['Left', 'Top'], function (name, i) {
            var method = SCROLL + name;

            DOM[method] = function (elem, v) {
                if (isNumber(elem)) {
                    return arguments.callee(win, elem);
                }
                elem = DOM.get(elem);
                var ret,
                    left,
                    top,
                    w = getWin(elem),
                    d;
                if (w) {
                    if (v !== undefined) {
                        v = parseFloat(v);
                        // 注意多 window 情况，不能简单取 win
                        left = name == 'Left' ? v : DOM.scrollLeft(w);
                        top = name == 'Top' ? v : DOM.scrollTop(w);
                        w['scrollTo'](left, top);
                    } else {
                        //标准
                        //chrome == body.scrollTop
                        //firefox/ie9 == documentElement.scrollTop
                        ret = w[ 'page' + (i ? 'Y' : 'X') + 'Offset'];
                        if (!isNumber(ret)) {
                            d = w[DOCUMENT];
                            //ie6,7,8 standard mode
                            ret = d[DOC_ELEMENT][method];
                            if (!isNumber(ret)) {
                                //quirks mode
                                ret = d[BODY][method];
                            }
                        }
                    }
                } else if (elem.nodeType == NodeType.ELEMENT_NODE) {
                    if (v !== undefined) {
                        elem[method] = parseFloat(v)
                    } else {
                        ret = elem[method];
                    }
                }
                return ret;
            }
        });

// add docWidth/Height, viewportWidth/Height getter methods
        S.each(['Width', 'Height'], function (name) {
            DOM['doc' + name] = function (refWin) {
                refWin = DOM.get(refWin);
                var w = getWin(refWin),
                    d = w[DOCUMENT];
                return MAX(
                    //firefox chrome documentElement.scrollHeight< body.scrollHeight
                    //ie standard mode : documentElement.scrollHeight> body.scrollHeight
                    d[DOC_ELEMENT][SCROLL + name],
                    //quirks : documentElement.scrollHeight 最大等于可视窗口多一点？
                    d[BODY][SCROLL + name],
                    DOM[VIEWPORT + name](d));
            };

            DOM[VIEWPORT + name] = function (refWin) {
                refWin = DOM.get(refWin);
                var prop = CLIENT + name,
                    win = getWin(refWin),
                    doc = win[DOCUMENT],
                    body = doc[BODY],
                    documentElement = doc[DOC_ELEMENT],
                    documentElementProp = documentElement[prop];
                // 标准模式取 documentElement
                // backcompat 取 body
                return doc[compatMode] === CSS1Compat
                    && documentElementProp ||
                    body && body[ prop ] || documentElementProp;
            }
        });

        function getClientPosition(elem) {
            var box, x , y ,
                doc = elem.ownerDocument,
                body = doc.body;

            if (!elem.getBoundingClientRect) {
                return {
                    left: 0,
                    top: 0
                };
            }

            // 根据 GBS 最新数据，A-Grade Browsers 都已支持 getBoundingClientRect 方法，不用再考虑传统的实现方式
            box = elem.getBoundingClientRect();

            // 注：jQuery 还考虑减去 docElem.clientLeft/clientTop
            // 但测试发现，这样反而会导致当 html 和 body 有边距/边框样式时，获取的值不正确
            // 此外，ie6 会忽略 html 的 margin 值，幸运地是没有谁会去设置 html 的 margin

            x = box[LEFT];
            y = box[TOP];

            // In IE, most of the time, 2 extra pixels are added to the top and left
            // due to the implicit 2-pixel inset border.  In IE6/7 quirks mode and
            // IE6 standards mode, this border can be overridden by setting the
            // document element's border to zero -- thus, we cannot rely on the
            // offset always being 2 pixels.

            // In quirks mode, the offset can be determined by querying the body's
            // clientLeft/clientTop, but in standards mode, it is found by querying
            // the document element's clientLeft/clientTop.  Since we already called
            // getClientBoundingRect we have already forced a reflow, so it is not
            // too expensive just to query them all.

            // ie 下应该减去窗口的边框吧，毕竟默认 absolute 都是相对窗口定位的
            // 窗口边框标准是设 documentElement ,quirks 时设置 body
            // 最好禁止在 body 和 html 上边框 ，但 ie < 9 html 默认有 2px ，减去
            // 但是非 ie 不可能设置窗口边框，body html 也不是窗口 ,ie 可以通过 html,body 设置
            // 标准 ie 下 docElem.clientTop 就是 border-top
            // ie7 html 即窗口边框改变不了。永远为 2
            // 但标准 firefox/chrome/ie9 下 docElem.clientTop 是窗口边框，即使设了 border-top 也为 0

            x -= docElem.clientLeft || body.clientLeft || 0;
            y -= docElem.clientTop || body.clientTop || 0;

            return { left: x, top: y };
        }


        function getPageOffset(el) {
            var pos = getClientPosition(el),
                w = getWin(el[OWNER_DOCUMENT]);
            pos.left += DOM[SCROLL_LEFT](w);
            pos.top += DOM[SCROLL_TOP](w);
            return pos;
        }

// 获取 elem 相对 elem.ownerDocument 的坐标
        function getOffset(el, relativeWin) {
            var position = {left: 0, top: 0},

            // Iterate up the ancestor frame chain, keeping track of the current window
            // and the current element in that window.
                currentWin = getWin(el[OWNER_DOCUMENT]),
                offset,
                currentEl = el;
            relativeWin = relativeWin || currentWin;

            do {
                // if we're at the top window, we want to get the page offset.
                // if we're at an inner frame, we only want to get the window position
                // so that we can determine the actual page offset in the context of
                // the outer window.
                offset = currentWin == relativeWin ?
                    getPageOffset(currentEl) :
                    getClientPosition(currentEl);
                position.left += offset.left;
                position.top += offset.top;
            } while (currentWin &&
                currentWin != relativeWin &&
                (currentEl = currentWin['frameElement']) &&
                (currentWin = currentWin.parent));

            return position;
        }

// 设置 elem 相对 elem.ownerDocument 的坐标
        function setOffset(elem, offset) {
            // set position first, in-case top/left are set even on static elem
            if (DOM.css(elem, POSITION) === 'static') {
                elem.style[POSITION] = RELATIVE;
            }

            var old = getOffset(elem),
                ret = { },
                current, key;

            for (key in offset) {
                current = myParseInt(DOM.css(elem, key), 10) || 0;
                ret[key] = current + offset[key] - old[key];
            }
            DOM.css(elem, ret);
        }

        return DOM;
    },
    {
        requires: ['./api']
    }
)
;

/*
 2012-03-30
 - refer: http://www.softcomplex.com/docs/get_window_size_and_scrollbar_position.html
 - http://help.dottoro.com/ljkfqbqj.php
 - http://www.boutell.com/newfaq/creating/sizeofclientarea.html

 2011-05-24
 - yiminghe@gmail.com：
 - 调整 docWidth , docHeight ,
 viewportHeight , viewportWidth ,scrollLeft,scrollTop 参数，
 便于放置到 Node 中去，可以完全摆脱 DOM，完全使用 Node


 TODO:
 - 考虑是否实现 jQuery 的 position, offsetParent 等功能
 - 更详细的测试用例（比如：测试 position 为 fixed 的情况）
 */

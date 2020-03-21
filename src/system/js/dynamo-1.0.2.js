var Dynamo = (function (exports) {
    'use strict';

    var SmoothAnchor = (function () {
        function SmoothAnchor() {
        }
        SmoothAnchor.enable = function (smoothScrollDuration, topOffsetSelector, additionalTopOffset) {
            SmoothAnchor.smoothScrollDuration = smoothScrollDuration;
            SmoothAnchor.topOffsetSelector = topOffsetSelector;
            SmoothAnchor.additionalTopOffset = additionalTopOffset;
            if (!SmoothAnchor.enabled) {
                SmoothAnchor.enabled = true;
                if (location.hash) {
                    var $target = $(location.hash.lastIndexOf("#!", 0) === 0 ?
                        location.hash.replace("#!", "#") :
                        location.hash);
                    if ($target.length) {
                        SmoothAnchor.smoothScrollTo($target[0], 100);
                    }
                }
                $('a[href*="#"]').not('[href="#"]').not('[href="#0"]').on("click", SmoothAnchor.anchorClick);
            }
        };
        SmoothAnchor.isEnabled = function () {
            return SmoothAnchor.enabled;
        };
        SmoothAnchor.anchorClick = function (event) {
            if (location.pathname.replace(/^\//, "") === this.pathname.replace(/^\//, "") &&
                location.hostname === this.hostname) {
                var $target = $(this.hash);
                $target = $target.length ? $target : $("[name=' + this.hash.slice(1) + ']");
                if ($target.length) {
                    event.preventDefault();
                    SmoothAnchor.smoothScrollTo($target[0], SmoothAnchor.smoothScrollDuration);
                    if (history.pushState) {
                        history.pushState(null, null, this.hash);
                    }
                    else {
                        location.hash = this.hash.replace("#", "#!");
                    }
                }
            }
        };
        SmoothAnchor.smoothScrollTo = function (target, duration) {
            var topOffset = this.additionalTopOffset;
            if (this.topOffsetSelector !== "" && $(this.topOffsetSelector).length) {
                topOffset += $(this.topOffsetSelector).height();
            }
            $("html, body").animate({
                scrollTop: $(target).offset().top - topOffset,
            }, duration, function () {
                target.focus();
                if (target !== document.activeElement) {
                    target.setAttribute("tabindex", "-1");
                    target.focus();
                }
            });
        };
        SmoothAnchor.topOffsetSelector = "";
        SmoothAnchor.additionalTopOffset = 0;
        SmoothAnchor.smoothScrollDuration = 0;
        SmoothAnchor.enabled = false;
        return SmoothAnchor;
    }());

    var ContentTOC = (function () {
        function ContentTOC(id, contentId, minHeading, maxHeading) {
            this.highlightClass = "active";
            this.scrollHighlightEnabled = false;
            this.id = id;
            if (contentId) ;
            else {
                this.anchors = $("#" + this.id + ' a[href*="#"]').not('[href="#"]').not('[href="#0"]')
                    .toArray();
                this.headings = [];
                for (var _i = 0, _a = this.anchors; _i < _a.length; _i++) {
                    var anchor = _a[_i];
                    this.headings.push.apply(this.headings, $(anchor.hash).filter(":header").toArray());
                }
            }
        }
        ContentTOC.prototype.enableScrollHighlight = function (highlightClass) {
            var _this = this;
            if (highlightClass) {
                this.highlightClass = highlightClass;
            }
            if (!this.scrollHighlightEnabled) {
                this.scrollHighlightEnabled = true;
                $(window).scroll(function () {
                    for (var _i = 0, _a = _this.headings; _i < _a.length; _i++) {
                        var heading = _a[_i];
                        var position = heading.getBoundingClientRect().top;
                        if (position > 0 && position < 200) {
                            _this.highlightHeadingAnchor("#" + heading.id);
                            break;
                        }
                    }
                });
                $(this.anchors).on("click", this, function (event) {
                    var _this = this;
                    var toc = event.data;
                    if (SmoothAnchor.isEnabled()) {
                        setTimeout(function () { toc.highlightHeadingAnchor(_this.hash); }, SmoothAnchor.smoothScrollDuration + 10);
                    }
                    else {
                        toc.highlightHeadingAnchor(this.hash);
                    }
                });
            }
        };
        ContentTOC.prototype.highlightHeadingAnchor = function (hash) {
            for (var _i = 0, _a = this.anchors; _i < _a.length; _i++) {
                var anchor = _a[_i];
                if (anchor.hash === hash) {
                    anchor.classList.add(this.highlightClass);
                }
                else {
                    anchor.classList.remove(this.highlightClass);
                }
            }
        };
        return ContentTOC;
    }());

    var Navigation = (function () {
        function Navigation(id, format, expandAllOnLoad, itemClass, currentItemClass, currentItemAncestorClass, linkClass, currentLinkClass, currentLinkAncestorClass, childNavClass, childNavExpandedClass, childNavCollapsedClass) {
            this.id = id;
            this.root = document.getElementById(this.id) ||
                document.currentScript.ownerDocument.getElementById(this.id);
            this.format = format;
            this.expandAllOnLoad = expandAllOnLoad;
            this.itemClass = itemClass;
            this.currentItemClass = currentItemClass;
            this.currentItemAncestorClass = currentItemAncestorClass;
            this.linkClass = linkClass;
            this.currentLinkClass = currentLinkClass;
            this.currentLinkAncestorClass = currentLinkAncestorClass;
            this.childNavClass = childNavClass;
            this.childNavExpandedClass = childNavExpandedClass;
            this.childNavCollapsedClass = childNavCollapsedClass;
            if (this.format === "tree") {
                $("li." + this.itemClass, this.root).on("click", this, Navigation.navigationItemClick);
                $("ul." + this.childNavClass, this.root).on("click", function () { event.stopPropagation(); });
            }
        }
        Navigation.navigationItemClick = function (event) {
            if (this.hasAttribute("aria-expanded")) {
                var $this = $(this);
                var currentlyExpanded = $this.attr("aria-expanded") === "true";
                $this.attr("aria-expanded", (!currentlyExpanded).toString());
                var nav = event.data;
                var $childNav = $this.find("> ul." + nav.childNavClass);
                if (currentlyExpanded) {
                    $childNav.addClass(nav.childNavCollapsedClass);
                    $childNav.removeClass(nav.childNavExpandedClass);
                }
                else {
                    $childNav.addClass(nav.childNavExpandedClass);
                    $childNav.removeClass(nav.childNavCollapsedClass);
                }
            }
        };
        Navigation.prototype.markCurrentPage = function () {
            var $currentLink = $('a[href="' + location.pathname + '"].' + this.linkClass, this.root);
            $currentLink.addClass(this.currentLinkClass);
            var $currentItem = $currentLink.closest("li." + this.itemClass, this.root);
            $currentItem.addClass(this.currentItemClass);
            var $parentLinks = $currentLink.parentsUntil(this.root, "a[href]." + this.linkClass);
            $parentLinks.addClass(this.currentLinkAncestorClass);
            var $parentItems = $currentItem.parentsUntil(this.root, "li." + this.itemClass);
            $parentItems.addClass(this.currentItemAncestorClass);
            if (this.format === "tree") {
                if (this.expandAllOnLoad === false) {
                    $parentItems.attr("aria-expanded", "true");
                    var $parentChildNavs = $currentItem.parentsUntil(this.root, "ul." + this.childNavClass);
                    $parentChildNavs.addClass(this.childNavExpandedClass);
                    $parentChildNavs.removeClass(this.childNavCollapsedClass);
                }
            }
        };
        return Navigation;
    }());

    // Polyfill for creating CustomEvents on IE9/10/11

    // code pulled from:
    // https://github.com/d4tocchini/customevent-polyfill
    // https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent#Polyfill

    (function() {
      if (typeof window === 'undefined') {
        return;
      }

      try {
        var ce = new window.CustomEvent('test', { cancelable: true });
        ce.preventDefault();
        if (ce.defaultPrevented !== true) {
          // IE has problems with .preventDefault() on custom events
          // http://stackoverflow.com/questions/23349191
          throw new Error('Could not prevent default');
        }
      } catch (e) {
        var CustomEvent = function(event, params) {
          var evt, origPrevent;
          params = params || {
            bubbles: false,
            cancelable: false,
            detail: undefined
          };

          evt = document.createEvent('CustomEvent');
          evt.initCustomEvent(
            event,
            params.bubbles,
            params.cancelable,
            params.detail
          );
          origPrevent = evt.preventDefault;
          evt.preventDefault = function() {
            origPrevent.call(this);
            try {
              Object.defineProperty(this, 'defaultPrevented', {
                get: function() {
                  return true;
                }
              });
            } catch (e) {
              this.defaultPrevented = true;
            }
          };
          return evt;
        };

        CustomEvent.prototype = window.Event.prototype;
        window.CustomEvent = CustomEvent; // expose definition to window
      }
    })();

    var SearchForm = (function () {
        function SearchForm(id, searchFieldId, searchResultContainerId, searchTrigger, minCharsToSearch) {
            if (minCharsToSearch === void 0) { minCharsToSearch = 1; }
            var _this = this;
            this.id = id;
            this.root = (document.getElementById(id) ||
                document.currentScript.ownerDocument.getElementById(id));
            this.searchField = (document.getElementById(searchFieldId) ||
                document.currentScript.ownerDocument.getElementById(searchFieldId));
            this.searchResultContainer = (document.getElementById(searchResultContainerId) ||
                document.currentScript.ownerDocument.getElementById(searchResultContainerId));
            this.searchTrigger = searchTrigger;
            this.minCharsToSearch = (minCharsToSearch > 0) ? minCharsToSearch : 1;
            $(this.searchField).on("search", function () { _this.dispatchSearchEvent(); });
            switch (this.searchTrigger) {
                case exports.SearchTrigger.StopTyping: {
                    var timeout_1 = null;
                    $(this.searchField).on("keyup", function () {
                        clearTimeout(timeout_1);
                        timeout_1 = setTimeout(function () {
                            _this.dispatchSearchEvent();
                        }, 500);
                    });
                    break;
                }
                case exports.SearchTrigger.KeyUp: {
                    $(this.searchField).on("keyup", function () { _this.dispatchSearchEvent(); });
                    break;
                }
                case exports.SearchTrigger.PressEnter: {
                    $(this.searchField).on("keyup", function () {
                        if (_this.searchField.value.length === 0) {
                            _this.dispatchSearchEvent();
                        }
                    });
                    break;
                }
            }
        }
        SearchForm.prototype.dispatchSearchEvent = function () {
            var s = this.searchField.value;
            if (s.length >= this.minCharsToSearch) {
                this.root.dispatchEvent(new CustomEvent(SearchForm.SEARCH_EVENT_NAME, {
                    bubbles: true,
                    detail: {
                        query: s,
                    },
                }));
            }
            else if (s.length === 0) {
                this.root.dispatchEvent(new CustomEvent(SearchForm.SEARCH_RESET_EVENT_NAME));
            }
        };
        Object.defineProperty(SearchForm.prototype, "onsearch", {
            set: function (listener) {
                this.root.addEventListener(SearchForm.SEARCH_EVENT_NAME, listener);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SearchForm.prototype, "onsearchcomplete", {
            set: function (listener) {
                this.root.addEventListener(SearchForm.SEARCH_COMPLETE_EVENT_NAME, listener);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SearchForm.prototype, "onsearchreset", {
            set: function (listener) {
                this.root.addEventListener(SearchForm.SEARCH_RESET_EVENT_NAME, listener);
            },
            enumerable: true,
            configurable: true
        });
        SearchForm.SEARCH_EVENT_NAME = "dynamo.search";
        SearchForm.SEARCH_COMPLETE_EVENT_NAME = "dynamo.searchcomplete";
        SearchForm.SEARCH_RESET_EVENT_NAME = "dynamo.searchreset";
        return SearchForm;
    }());
    (function (SearchTrigger) {
        SearchTrigger[SearchTrigger["StopTyping"] = 0] = "StopTyping";
        SearchTrigger[SearchTrigger["KeyUp"] = 1] = "KeyUp";
        SearchTrigger[SearchTrigger["PressEnter"] = 2] = "PressEnter";
    })(exports.SearchTrigger || (exports.SearchTrigger = {}));

    var SearchResult = (function () {
        function SearchResult(type, url, title, excerpt) {
            this.type = type;
            this.url = url;
            this.title = title;
            this.excerpt = excerpt;
        }
        return SearchResult;
    }());

    exports.ContentTOC = ContentTOC;
    exports.Navigation = Navigation;
    exports.SearchForm = SearchForm;
    exports.SearchResult = SearchResult;
    exports.SmoothAnchor = SmoothAnchor;

    return exports;

}({}));

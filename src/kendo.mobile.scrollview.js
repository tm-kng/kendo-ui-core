(function($, undefined) {
    var mobile = kendo.mobile,
        ui = mobile.ui,
        proxy = $.proxy,
        Class = kendo.Class,
        Transition = kendo.fx.Transition,
        Widget = ui.Widget,

        // Math
        math = Math,
        abs  = math.abs,
        ceil = math.ceil,
        round = math.round,
        max = math.max,
        min = math.min,
        floor = math.floor;

    var CURRENT_PAGE_CLASS = "km-current-page";

    /**
    * @name kendo.mobile.ui.ScrollView.Description
    * @section The Kendo Mobile ScrollView widget is used to scroll content wider than the device screen.
    *
    * <h3>Getting Started</h3>
    * <p>The Kendo Mobile Application automatically initializes the Mobile ScrollView for every element with <code>role</code> data attribute set to <code>scrollview</code> present in the views' markup.
    * Alternatively, it can be initialized using a jQuery selector. </p>
    * @exampleTitle Initialize mobile ScrollView using a role data attribute.
    * @example
    * <div data-role="scrollview">
    *   Foo
    * </div>
    *
    * @exampleTitle Initialize mobile ScrollView using a jQuery selector.
    * @example
    * <div id="scrollView"></div>
    * <script>
    * var listView = $("#scrollView").kendoMobileScrollView();
    * </script>
    *
    */
    var ScrollView = Widget.extend(/** @lends kendo.mobile.ui.ScrollView.prototype */{
        /**
        * @constructs
        * @extends kendo.mobile.ui.Widget
        * @param {DomElement} element DOM element
        * @param {Object} options
        * @option {Number} [duration] <300> The milliseconds that take the ScrollView to snap to the current page after released.
        * @option {Number} [velocityThreshold] <0.8> The velocity threshold after which a swipe will navigate to the next page (as opposed to snapping back to the current view).
        * The swipe velocity equal the pixels per millisecond change for a swipe.
        * @option {Number} [bounceVelocityThreshold] <1.6> The velocity threshold after which a swipe will result in a bounce effect.
        */
        init: function(element, options) {
            var that = this;

            Widget.fn.init.call(that, element, options);

            element = that.element;

            element
                .wrapInner("<div/>")
                .addClass("km-scrollview")
                .append('<ol class="km-pages"/>');

            that.inner = element.children().first();
            that.pager = element.children().last();
            that.page = 0;

            var movable,
                transition,
                drag,
                dimensions,
                dimension,
                pane;

            movable = new kendo.ui.Movable(that.inner);

            transition = new Transition({
                axis: "x",
                movable: movable,
                onEnd: function() {
                    that.page = Math.round(- movable.x / dimension.size);
                    that._updatePage();
                }
            });

            drag = new kendo.Drag(element, {
                start: function() {
                    if (abs(drag.x.velocity) * 2 >= abs(drag.y.velocity)) {
                        drag.capture();
                    } else {
                        drag.cancel();
                    }

                    transition.cancel();
                },
                end: $.proxy(that._dragEnd, that)
            });

            dimensions = new mobile.PaneDimensions({
                element: that.inner,
                container: that.element
            });

            dimension = dimensions.x;
            dimension.bind("change", proxy(that.refresh, that));

            pane = new mobile.Pane({
                dimensions: dimensions,
                drag: drag,
                movable: movable,
                elastic: true
            });

            $.extend(that, {
                movable: movable,
                transition: transition,
                drag: drag,
                dimensions: dimensions,
                dimension: dimension,
                pane: pane
            });

            dimensions.refresh();
        },

        options: {
            name: "ScrollView",
            duration: 300,
            velocityThreshold: 0.8,
            bounceVelocityThreshold: 1.6
        },

        viewShow: function(view) {
            this.dimensions.refresh();
        },

        /**
        * Redraw the mobile ScrollView pager. Called automatically on device orientation change event.
        *
        * @example
        * <div data-role="scrollview" id="scrollview"></div>
        *
        * <script>
        *    $("#scrollview").data("kendoMobileScrollView").refresh();
        * </script>
        */
        refresh: function() {
            var that = this,
                pageHTML = "",
                dimension = that.dimension,
                width = dimension.size,
                pages;

            that.page = Math.round(-that.movable.x / width);

            pages = that.pages = ceil(dimension.total / width);

            that.minSnap = - (pages - 1) * width;
            that.maxSnap = 0;

            for (var idx = 0; idx < pages; idx ++) {
                pageHTML += "<li/>";
            }

            that.pager.html(pageHTML);
            that._updatePage();
        },

        _dragEnd: function(e) {
            var that = this,
                velocity = e.x.velocity,
                width = that.dimension.size,
                options = that.options,
                velocityThreshold = options.velocityThreshold,
                snap,
                approx = round,
                ease = Transition.easeOutExpo;

            if (velocity > velocityThreshold) {
                approx = ceil;
            } else if(velocity < -velocityThreshold) {
                approx = floor;
            }

            if (abs(velocity) > options.bounceVelocityThreshold) {
                ease = Transition.easeOutBack;
            }

            snap = max(that.minSnap, min(approx(that.movable.x / width) * width, that.maxSnap));

            that.transition.moveTo({ location: snap, duration: options.duration, ease: ease });
        },

        _updatePage: function() {
            var that = this,
                pager = that.pager;

            pager.children().removeClass(CURRENT_PAGE_CLASS);
            pager.find(":nth-child(" + (that.page + 1) +")").addClass(CURRENT_PAGE_CLASS);
        }
    });

    ui.plugin(ScrollView);
})(jQuery);

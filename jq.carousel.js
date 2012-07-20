(function($) {
    var cache = [];
    $.carousel = function(el, opts) {
        if (opts === undefined && this.length > 0) {
            return cache[this.id] ? cache[this.id] : null;
        }
        var tmp = new carousel(el, opts);
        if (this.id) cache[this.id] = tmp;
        return this.length === 1 ? tmp : this;
    };
    
    var carousel = (function() {
        if (!window.WebKitCSSMatrix) {
            return;
        }
        var translateOpen = 'm11' in new WebKitCSSMatrix() ? "3d(" : "(";
        var translateClose = 'm11' in new WebKitCSSMatrix() ? ",0)" : ")";
        
        var carousel = function(containerEl, opts) {
            if (typeof containerEl === "string" || containerEl instanceof String) {
                this.container = document.getElementById(containerEl);
            } else {
                this.container = containerEl;
            }
            if (!this.container) {
                alert("Error finding container for carousel " + containerEl);
                return;
            }
            if (this instanceof carousel) {
                for (var j in opts) {
                    if (opts.hasOwnProperty(j)) {
                        this[j] = opts[j];
                    }
                }
            } else {
                
                return new carousel(containerEl, opts);
            }
            try {
                var that = this;
				window.that = this;
                this.pagingDiv = this.pagingDiv ? document.getElementById(this.pagingDiv) : null;

                // initial setup
                this.container.style.overflow = "hidden";
                this.container.style['-webkit-box-orient'] = "vertical";
                this.container.style['display'] = "-webkit-box";
                this.container.style['-webkit-box-orient'] = "vertical";
                if (this.vertical) {
                    this.horizontal = false;
                }
                var tmpHTML = this.container.innerHTML;
                this.container.innerHTML = "";
                var el = document.createElement("div");
                el.innerHTML = tmpHTML;
                if (this.horizontal) {
                    el.style.display = "-webkit-box";
                    el.style['-webkit-box-flex'] = 1;
                } 
                else {
                    el.style.display = "block";
                }
                this.container.appendChild(el);
                this.el = el;
                this.refreshItems();
				this.mostVisited = document.getElementById("mostVisited");
				this.page1 = document.getElementById("urlIcons");
				this.siteNav = document.getElementById("siteNav");
				el.addEventListener('touchmove', function(e) {
                    that.touchMove(e);
                }, false);
                el.addEventListener('touchend', function(e) {
                    that.touchEnd(e);
                }, false);
                el.addEventListener('touchstart', function(e) {
                    that.touchStart(e);
                }, false);
				window.orientationChange = function(){
					if(orientation){
						that.__proto__.maxY.y2 = (-(document.getElementsByClassName("mvItem").length-2.5)*(53));
						that.__proto__.maxY.y1 = (-Math.ceil(document.getElementsByClassName("iconContainer").length/6)*(97)+document.getElementsByClassName("urlContainer")[0].clientHeight);
					}
					else{
						that.__proto__.maxY.y2 = (-(document.getElementsByClassName("mvItem").length-6)*(parseInt(getComputedStyle(this.mostVisited).height)/6));
						that.__proto__.maxY.y1 = (-Math.ceil(document.getElementsByClassName("iconContainer").length/4)*(97)+document.getElementsByClassName("urlContainer")[0].clientHeight);
					}
					that.onMoveIndex(that.carouselIndex, 0);
					that.moveCSS3(that.mostVisited,{x:0,y:0});
					that.moveCSS3(that.page1, {x:0,y:0});
					that.pagePos.y2 = that.pagePos.y1 = that.pagePos.y0 = 0;
				};
            } catch (e) {
                console.log("error adding carousel " + e);
            }
        };
        
        carousel.prototype = {
            startX: 0,
            startY: 0,
            dx: 0,
            dy: 0,
            myDivWidth: 0,
            myDivHeight: 0,
            cssMoveStart: 0,
            childrenCount: 0,
            carouselIndex: 0,
            vertical: false,
            horizontal: true,
            el: null,
            movingElement: false,
            container: null,
            pagingDiv: null,
            pagingCssName: "carousel_paging",
            pagingCssNameSelected: "carousel_paging_selected",
            pagingFunction: null,
			direction: "",
			page0Length: 5,
			drag: 40,
			pagePos:{y0:0,y1:0,y2:0},
			maxY:{y0:0,y1:0,y2:0},
            // handle the moving function
            touchStart: function(e) {
				this.hasMoved = false;
				this.direction = "";
                this.myDivWidth = numOnly(this.container.clientWidth/2);
                this.myDivHeight = numOnly(this.container.clientHeight);				
				var index = "y"+this.carouselIndex;
				if(!this.maxY[index]){
					if(!window.orientation){
						if(this.carouselIndex == 2)
							this.maxY[index] = (-(document.getElementsByClassName("mvItem").length-6)*(parseInt(getComputedStyle(this.mostVisited).height)/6));
						else if(this.carouselIndex == 1)
							this.maxY[index] = (-Math.ceil(document.getElementsByClassName("iconContainer").length/4)*(97)+parseInt(getComputedStyle(this.page1).height));
					}					
					else{
						if(this.carouselIndex == 2)
							this.maxY[index] = (-(document.getElementsByClassName("mvItem").length-2.5)*(53));
						else if(this.carouselIndex == 1)
							this.maxY[index] = (-Math.ceil(document.getElementsByClassName("iconContainer").length/6)*(97)+document.getElementsByClassName("urlContainer")[0].clientHeight);
					}
				}
				if(index === "y0"){
					this.maxY["y0"] = document.getElementById("siteNavContainer").clientHeight-document.getElementById("siteNav").clientHeight;
					if(typeof window.memHeight == "number"){
						this.pagePos["y0"] = -window.memHeight;
						window.memHeight = undefined;
					}
				}
				if(this.maxY[index]>0)
					this.maxY[index] = 0;
                if (e.touches.length === 1) {                    
                    this.movingElement = true;
                    this.startY = e.touches[0].pageY;
                    this.startX = e.touches[0].pageX;
                   // e.preventDefault();
                   // e.stopPropagation();
                    if (this.vertical) {
                        try {
                            this.cssMoveStart = numOnly(new WebKitCSSMatrix(window.getComputedStyle(this.el, null).webkitTransform).f);
                        } catch (ex1) {
                            this.cssMoveStart = 0;
                        }
                    } else {
                        try {
                            this.cssMoveStart = numOnly(new WebKitCSSMatrix(window.getComputedStyle(this.el, null).webkitTransform).e);
                        } catch (ex1) {
                            this.cssMoveStart = 0;
                        }
                    }
                }
            },
            touchMove: function(e) {
				this.hasMoved = true;
                if(!this.movingElement)
                   return;
                if (e.touches.length > 1) {
                    return this.touchEnd(e);
                }
                
                var rawDelta = {
                    x: e.touches[0].pageX - this.startX,
                    y: e.touches[0].pageY - this.startY
                };
                if(!this.direction){
					this.direction = (Math.abs(rawDelta.x)>Math.abs(rawDelta.y))?"horizontal":"vertical";
				}
                if (this.vertical) {
                    var movePos = { x: 0, y: 0 };
                    this.dy = e.touches[0].pageY - this.startY;
                    this.dy += this.cssMoveStart;
                    movePos.y = this.dy;
                } else {
					if(this.direction == "horizontal"){
						var movePos = {x: 0,y: 0};
						this.dx = e.touches[0].pageX - this.startX;
						this.dx += this.cssMoveStart;						
						movePos.x = this.dx;						
						this.moveCSS3(this.el, movePos);
					}else{
						var index = "y"+this.carouselIndex;
						var movePos = {x:0, y:0};
						movePos.y = rawDelta.y + this.pagePos[index];
						if(movePos.y>this.drag){
							movePos.y = this.drag;
						}
						else if(this.maxY[index]<=0 && movePos.y<(this.maxY[index]-this.drag)){
							movePos.y = this.maxY[index]-this.drag;
						}
						if(this.carouselIndex == 1){
							this.moveCSS3(this.page1, movePos);
						}
						else if(this.carouselIndex == 2){
							this.moveCSS3(this.mostVisited, movePos);
						}
						else{
							this.moveCSS3(this.siteNav, movePos);
						}
						this.dy = movePos.y;
					}
                }
                e.preventDefault();
				e.stopPropagation();
            },
            touchEnd: function(e) {
                if (!this.movingElement || !this.hasMoved) {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                var runFinal = false;
                try {
                    var endPos = this.vertical ? numOnly(new WebKitCSSMatrix(window.getComputedStyle(this.el, null).webkitTransform).f) : numOnly(new WebKitCSSMatrix(window.getComputedStyle(this.el, null).webkitTransform).e);
                    if (endPos > 0) {
                        this.moveCSS3(this.el, {
                            x: 0,
                            y: 0
                        }, "300", "cubic-bezier(0.33,0.66,0.66,1)", "detect");
                    } else {
                        var totalMoved = this.vertical ? ((this.dy % this.myDivHeight) / this.myDivHeight * 100) * -1 : ((this.dx % this.myDivWidth) / this.myDivWidth * 100) * -1; // get a percentage of movement.
                        // Only need
                        // to drag 3% to trigger an event
                        var currInd = this.carouselIndex;
						var time = 0;
                        if (endPos < this.cssMoveStart && totalMoved > 3) {
                            currInd++; // move right/down
                        } else if ((endPos > this.cssMoveStart && totalMoved < 97)) {
                            currInd--; // move left/up
                        }
                        if (currInd > (this.childrenCount - 1)) {
                            currInd = this.childrenCount - 1;
                        }
                        if (currInd < 0) {
                            currInd = 0;
                        }
                        var movePos = {
                            x: 0,
                            y: 0
                        };
                        if (this.vertical) {
                            movePos.y = (currInd * this.myDivHeight * -1);
                        } 
                        else {
							if(this.direction == "horizontal"){
								movePos.x = (currInd * this.myDivWidth * -1);
								this.moveCSS3(this.el, movePos, "150", "linear", "detect");
							}
							else{
								var index = "y"+this.carouselIndex;								
								movePos.y = this.dy;
								if(movePos.y>0){
									movePos.y=0;
									var time = 300;
								}
								else if(movePos.y<this.maxY[index]){
									movePos.y = this.maxY[index];
									var time = 300;
								}
								this.pagePos[index] = movePos.y;
								if(this.carouselIndex == 1){
									this.moveCSS3(this.page1, movePos, time, "cubic-bezier(0.33,0.66,0.66,1)");
								}
								else if(this.carouselIndex == 2){
									this.moveCSS3(this.mostVisited, movePos, time, "cubic-bezier(0.33,0.66,0.66,1)");
								}
								else{
									this.moveCSS3(this.siteNav, movePos, time, "cubic-bezier(0.33,0.66, 0.66,1)");
								}
							}								
                        }                        
                        if (this.pagingDiv && this.carouselIndex !== currInd) {
                            document.getElementById(this.container.id + "_" + this.carouselIndex).className = this.pagingCssName;
                            document.getElementById(this.container.id + "_" + currInd).className = this.pagingCssNameSelected;
                        }
                        if (this.carouselIndex != currInd)
                            runFinal = true;
                        this.carouselIndex = currInd;
						localStorage.index = currInd;
                    }
                } catch (e) {
                    console.log(e);
                }
                this.dx = 0;
                this.movingElement = false;
                this.startX = 0;
                this.dy = 0;
                this.startY = 0;
                if (runFinal && this.pagingFunction && typeof this.pagingFunction == "function")
                    this.pagingFunction(this.carouselIndex);
            },
            onMoveIndex: function(newInd,transitionTime) {
                
                this.myDivWidth = numOnly(this.container.clientWidth/2);
                this.myDivHeight = numOnly(this.container.clientHeight);
                var runFinal = false;
                try {
					document.getElementById(this.container.id + "_" + this.carouselIndex).className = this.pagingCssName;
                    var newTime = Math.abs(newInd - this.carouselIndex);
                    
                    var ind = newInd;
                    if (ind < 0)
                        ind = 0;
                    if (ind > this.childrenCount - 1) {
                        ind = this.childrenCount - 1;
                    }
                    var movePos = {
                        x: 0,
                        y: 0
                    };
                    if (this.vertical) {
                        movePos.y = (ind * this.myDivHeight * -1);
                    } 
                    else {
                        movePos.x = (ind * this.myDivWidth * -1);
                    }
                    
                    var time =transitionTime?transitionTime: 50 + parseInt((newTime * 20));
                    this.moveCSS3(this.el, movePos, time, "linear", "detect");
                    if (this.carouselIndex != ind)
                        runFinal = true;
                    this.carouselIndex = ind;
                    if (this.pagingDiv) {                        
                        document.getElementById(this.container.id + "_" + this.carouselIndex).className = this.pagingCssNameSelected;
                    }
                } catch (e) {
                    console.log("Error " + e);
                }
                if (runFinal && this.pagingFunction && typeof this.pagingFunction == "function")
                    this.pagingFunction(currInd);
            },
            
            moveCSS3: function(el, distanceToMove, time, timingFunction) {
                if (!time)
                    time = 0;
                else
                    time = parseInt(time);
                if (!timingFunction)
                    timingFunction = "linear";
                
                el.style.webkitTransform = "translate" + translateOpen + distanceToMove.x + "px," + distanceToMove.y + "px" + translateClose;
                el.style.webkitTransitionDuration = time + "ms";
                el.style.webkitBackfaceVisiblity = "hidden";
                el.style.webkitTransformStyle = "preserve-3d";
                el.style.webkitTransitionTimingFunction = timingFunction;
				if(arguments[4] && this.hasMoved){
					var that = this;
					window.transitionListener = setTimeout(function () {
						el.style.webkitTransform = "";
						setTimeout(function () {
							console.log("Animation error detected, fixing!");
							el.style.webkitTransform = "translate" + translateOpen + distanceToMove.x + "px," + distanceToMove.y + "px" + translateClose;
						}, 0);
					}, 500);
				}
            },
            
            addItem: function(el) {
                if (el && el.nodeType) {                    
                    this.container.childNodes[0].appendChild(el);
                    this.refreshItems();
                }
            },
            refreshItems: function() {
                var childrenCounter = 0;
                var that = this;
                var el = this.el;
                n = el.childNodes[0];
                var widthParam;
                var heightParam = "100%";
                var elems = [];
                for (; n; n = n.nextSibling) {
                    if (n.nodeType === 1) {
                        elems.push(n);
                        childrenCounter++;
                    }
                }
                this.childrenCount = childrenCounter;
                widthParam = "50%";
                for (var i = 0; i < elems.length; i++) {                   
                    if (this.horizontal) {
                        elems[i].style.width = widthParam;
                        elems[i].style.height = "100%";
                    } 
                    else {
                        elems[i].style.height = "100%";
                        elems[i].style.width = "100%";
                        elems[i].style.display = "block";
                    }               
                }
                el.style.width = "100%";
                el.style.height = "100%";
                el.style['min-height'] = "100%"; 
                if (this.pagingDiv) {
                    for (i = 0; i < this.childrenCount; i++) {
                        var pagingEl = document.getElementById("carousel_"+i);
                        pagingEl.pageId = i;
                        if (i !== 0) {
                            pagingEl.className = this.pagingCssName;
                        } else {
                            pagingEl.className = this.pagingCssNameSelected;
                        }
                        pagingEl.onclick = function () {
                            that.onMoveIndex(this.pageId);
                        };                        
                        this.pagingDiv.appendChild(pagingEl);
                        pagingEl = null;
                    }
                }
				//avoid blank page when load it at first time. The reason is webkit init width as zero in wrong way.
				setTimeout(function(){
					localStorage.index ? that.onMoveIndex((+localStorage.index), 0) : that.onMoveIndex(1,0);
					that.moveCSS3(that.mostVisited,{x:0,y:0});
					eventCreate(document.getElementById("page1"));
				},100); 
            }
        };
        return carousel;
    })();
	
	function numOnly(val){
		if (isNaN(parseFloat(val)))
			val = val.replace(/[^0-9.-]/, "");
		return parseFloat(val);
	}
})(document.getElementById("carousel"));

function init_carousel() {
	var carousel = document.getElementById("carousel").carousel("carousel", {
	    pagingDiv: "carousel_dots",
	    pagingCssName: "carousel_paging",
	    pagingCssNameSelected: "carousel_paging_selected",
	    preventDefaults: false
	});
}
window.addEventListener("load", init_carousel, false);

window.addEventListener("webkitTransitionEnd",function(){
	clearTimeout(window.transitionListener);
	console.log("Transition end!");
},false);
;(function ($) {
	if (typeof $ === undefined) {
		throw "jq文件未引用"
	}

	const body = $("body");
	const dragBtn = $('button.drag-matter-btn');
	const inputs = $(".sub-menu-list").find("input");
	const previewBtn = $("#preview");
	const editBtn = $("#edit");
	let records = [];
	let moveNode = undefined;
	let rootRecord = true;
	let dashBox = $("<div class='dash-box'></div>");
	let dashHeight = 100;
	let moveFlag = false;
	let moveExist = false;
	let movePlace = {
		index: 0,
		node: undefined
	};
	let dx = 0, dy = 0;

	function loopRecord(baseLeft, baseTop, node) {
		var jqNode = node || $(".main-box");
		var needRecord = rootRecord || !!node;
		var position = jqNode.position();
		var height = jqNode.outerHeight();
		var width = jqNode.outerWidth();
		node && (position.top = 0);
		var top = position.top + baseTop;
		var left = position.left + baseLeft;
		var right = left + width;
		var bottom = top + height;
		var children = jqNode.children();
		if (!children.length) {
			needRecord && records.push({
				left: left,
				top: top,
				bottom: bottom,
				right: right,
				width: width,
				height: height,
				node: jqNode
			})
		} else {
			var top1 = top, height1 = 0, bottom1 = 0;
			children.each((index, child) => {
				child = $(child);
				var isComponent = child.hasClass('row-component');
				height1 = index ? 62 : 76;
				isComponent && (height1 -= 16);
				bottom1 = top1 + height1;
				needRecord && records.push({
					left: left,
					top: top1,
					bottom: bottom1,
					right: right,
					width: width,
					height: height1,
					node: jqNode,
					childIndex: index
				})
				child.find(".box").each((i, child) => {
					child = $(child);
					loopRecord(left + 16, bottom1, child);
				})
				top1 = child.height() + bottom1;
			})
			needRecord && records.push({
				left: left,
				top: top1,
				bottom: bottom,
				right: right,
				width: width,
				height: height,
				node: jqNode
			})
		}
	}

	function record() {
		window.records = records = [];
		dashBox.height(dashHeight);
		loopRecord(0, 0);
	}

	function check(top, left, isLay) {
		var item = records.find(item => {
			return top > item.top && top < item.bottom && left > item.left && left < item.right;
		})
		if (item) {
			if (!isLay) {
				if (item.childIndex !== undefined) {
					dashBox.insertBefore(item.node.children().eq(item.childIndex));
				} else {
					dashBox.appendTo(item.node);
				}
			} else {
				dashBox.remove();
				var rowBox;
				if (rootRecord) {
					rowBox = $("<div class='row clearfix'></div>");
				} else {
					rowBox = $("<div class='row row-component' style='position: relative;'></div>")
				}
				if (!moveExist) {//本来存在
					rowBox.html(moveNode.find(".main-content").html())
					$('<button class="drag-matter-btn">拖动</button>').on('mousedown', function (event) {
						mousedown.call(this, event, true);
					}).appendTo(rowBox);
					$('<button class="del-matter-btn">删除</button>').on("click", function () {
						$(this).parent().remove();
					}).appendTo(rowBox);
				} else {
					rowBox = moveNode.removeAttr('style');
					rowBox.find(".drag-matter-btn").on('mousedown', function (event) {
						mousedown.call(this, event, true);
					}).end().find(".del-matter-btn").on("click", function () {
						$(this).parent().remove();
					});
				}
				if (item.childIndex !== undefined) {
					rowBox.insertBefore(item.node.children().eq(item.childIndex));
				} else {
					rowBox.appendTo(item.node);
				}
			}
		} else {
			if (isLay && moveExist) {
				var index = movePlace.index;
				var parent = movePlace.node;
				rowBox = moveNode.removeAttr('style');
				rowBox.find(".drag-matter-btn").on('mousedown', function (event) {
					mousedown.call(this, event, true);
				}).end().find(".del-matter-btn").on("click", function () {
					$(this).parent().remove();
				});
				if (index === 0) {
					parent.append(rowBox)
				} else {
					parent.children().eq(index - 1).after(rowBox)
				}
			}
			dashBox.remove();
		}
	}

	function getElement() {
		var node;
		var name = $(this).prev().data('name');
		//判断类型(是否组件)
		if (name) {
			rootRecord = false;
			var id = '#component-' + name;
			node = $(id).clone().removeAttr("id");
		} else {
			rootRecord = true;
			var rate = $(this).prev().find('input').val();
			if (rate) {
				node = $("#grid-layout").clone().removeAttr("id");
				var content = node.find(".main-content");
				node.find(".drag-matter-cont").html(rate);
				rate.split(" ").forEach(col => {
					content.append($("<div class=\"box col-md-" + col + "\"></div>"))
				});
			} else {
				node = $("#abs-layout").clone().removeAttr("id");
			}
		}
		return node;
	}

	function mousedown(event, exist) {
		moveExist = !!exist;
		moveNode = exist ? $(this).closest(".row") : getElement.call(this);
		if (exist) {
			rootRecord = !moveNode.hasClass('row-component');
		}
		dx = 140;
		dy = 0;
		var e = event.originalEvent;
		if (exist) {
			var position = $(this).position();
			dx = e.offsetX + position.left;
			dy = e.offsetY + position.top + 15;//外边距
			movePlace.index = moveNode.index();
			movePlace.node = moveNode.parent();
		}
		var left = e.clientX - dx;
		var top = e.clientY - dy;
		moveFlag = true;
		var cssObj = {
			position: 'fixed',
			left: left,
			top: top,
			userSelect: "none",
			zIndex: "999"
		};
		exist && (cssObj['width'] = moveNode.outerWidth());
		moveNode.prependTo(body.css('cursor', 'move')).css(cssObj);
		dashHeight = moveNode.outerHeight();
		record();
	}

	function mousemove(event) {
		if (moveFlag) {
			var e = event.originalEvent;
			var left = e.clientX - dx;
			var top = e.clientY - dy;
			moveNode.css({left: left, top: top});
			check(e.pageY, e.pageX);
		}
	}

	function mouseup(event) {
		if (moveFlag) {
			var e = event.originalEvent;
			var left = e.clientX - dx;
			var top = e.clientY - dy;
			moveNode.css({left: left, top: top});
			moveNode.remove();
			check(e.pageY, e.pageX, true);
			body.css('cursor', '');
		}
		moveFlag = false;
	}

	/*网格数字验证*/
	function gridNumCheck(str) {
		str = str.split(' ');
		var nums = [];
		var value = 0;
		var pattern = /^\d+/;
		for (var x = 0, l = str.length; x < l; x++) {
			var matchStr = str[x];
			var item = matchStr.match(pattern);
			if (!item) {
				return false;
			}
			nums.push(item[0] - 0);
		}
		for (x = 0; x < nums.length; x++) {
			value += nums[x];
		}
		return value === 12;
	}

	//注册事件监听;
	(function eventListening() {
		$(document).on("mousemove", mousemove).on("mouseup", mouseup);
		dragBtn.on("mousedown", mousedown);
		inputs.keyup(function () {
			var value = $(this).val();
			var btn = $(this).parent().next()
			if (!gridNumCheck(value)) {
				btn.hide();
			} else {
				btn.show();
			}
		});
		previewBtn.click(function () {
			$('.main-box').find(".drag-matter-btn").hide().end().find('.del-matter-btn').hide();
			$('.main-box').find(".row").removeClass('row').addClass('column');
			$('.main-box').find('.box').removeClass('box').addClass('box-o');
		});
		editBtn.click(function () {
			$('.main-box').find(".drag-matter-btn").show().end().find('.del-matter-btn').show();
			$('.main-box').find(".column").removeClass('column').addClass('row');
			$('.main-box').find('.box-o').removeClass('box-o').addClass('box');
		});
	}());
}(jQuery));
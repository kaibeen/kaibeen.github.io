function calcWidth(value) {
	var num = Number(value);
	num = isNaN(num) ? 1 : num;
	return Math.floor(10000 / num) / 100 + '%';
}

function file2base64(file) {
	var promise = $.Deferred();
	var reader = new FileReader();
	reader.onload = function (e) {
		promise.resolve(e.target.result);
	};
	reader.onerror = function (err) {
		promise.reject(err);
	}
	reader.readAsDataURL(file);
	return promise;
}

(function ($) {
	if (typeof $ === undefined) {
		throw "jq文件未引用"
	}

	var body = $("body");
	var records = [];
	var moveNode = undefined;
	var boxNode = undefined;
	var dashBox = undefined;
	var callback = undefined;
	var moveFlag = false;
	var eventBox = undefined;
	var documentHeight = 0;
	var scrollFlag = false;
	var scrollY = 0;
	var initIndex = -1;
	var classMsg = {
		dashClass: '',
		targetClass: '',
		dragClass: '',
		boxClass: ''
	}
	var dx = 0, dy = 0;

	function record() {
		records = [];
		boxNode.children(classMsg.targetClass).each(function () {
			var jqNode = $(this);
			var position = jqNode.offset();
			var top = position.top - 20;
			var left = position.left;
			var height = jqNode.outerHeight();
			var width = jqNode.outerWidth();
			var right = left + width + 200;
			var bottom = top + height + 20;
			records.push({
				left: left,
				top: top,
				bottom: bottom,
				right: right,
				width: width,
				height: height,
				node: jqNode
			});
		});
	}

	function check(top, left, isLay) {
		var item = records.find(item => {
			return top > item.top && top < item.bottom && left > item.left && left < item.right;
		})
		if (item) {
			if (!isLay) {
				dashBox.insertBefore(item.node);
			} else {
				moveNode.removeAttr('style').insertBefore(item.node);
				dashBox.remove();
			}
		} else {
			if (!isLay) {
				boxNode.append(dashBox);
			} else {
				moveNode.removeAttr('style').appendTo(boxNode);
				dashBox.remove();
			}
		}
	}

	function mousedown(event) {
		var e = event.originalEvent;
		var self = $(this);
		scrollY = window.scrollY;
		moveNode = self.parents(classMsg.targetClass);
		initIndex = moveNode.index();
		var position = getMoveNodePosition(self, moveNode);
		dx = e.offsetX + position.left;
		dy = e.offsetY + position.top + 20;//外边距
		boxNode = self.parents(classMsg.boxClass);
		var left = e.clientX - dx;
		var top = e.clientY - dy;
		moveFlag = true;
		var cssObj = {
			position: 'fixed',
			left: left,
			top: top,
			userSelect: "none",
			zIndex: "999",
			opacity: '0.7'
		};
		moveNode.prependTo(body.css('cursor', 'move')).css(cssObj).addClass('fix-show');
		body.css('cursor', 'move');
		dashBox = $('<div></div>').attr('class', classMsg.dashClass.replace('.', ''));
		boxNode.append(dashBox);
		record();
	}

	function getMoveNodePosition(child, parent) {
		var position = child.position();
		var left = position.left;
		var top = position.top;
		var parentEl = child.parent();
		if (parentEl[0] !== parent[0]) {
			position = parentEl.position();
			left += position.left;
			top += position.top;
		}
		return {
			left: left,
			top: top
		}
	}

	function mousemove(event) {
		if (moveFlag) {
			var e = event.originalEvent;
			var left = e.clientX - dx;
			var top = e.clientY - dy;
			moveNode.css({ left: left, top: top });
			if (event.clientY < 0) {
				if (!scrollFlag) {
					scrollFlag = true;
					scrollToTop();
				}
			} else if (event.clientY > window.innerHeight) {
				if (!scrollFlag) {
					scrollFlag = true;
					scrollToBot();
				}
			} else {
				scrollFlag = false;
			}
			check(e.pageY, e.pageX);
		} else {
			scrollFlag = false;
		}
	}

	/*滚动到上方*/
	function scrollToTop() {
		function goTop() {
			if (scrollFlag && moveFlag) {
				window.setTimeout(function () {
					window.scrollBy(0, -15);
					goTop();
				}, 16)
			} else {
				scrollFlag = false;
			}
		}

		goTop();
	}

	/*滚动到下方*/
	function scrollToBot() {
		function goBot() {
			if (scrollFlag && moveFlag) {
				window.setTimeout(function () {
					window.scrollBy(0, 15);
					goBot();
				}, 16)
			} else {
				scrollFlag = false;
			}
		}

		goBot();
	}


	function mouseup(event) {
		if (moveFlag) {
			var e = event.originalEvent;
			var left = e.clientX - dx;
			var top = e.clientY - dy;
			moveNode.css({ left: left, top: top });
			moveNode.remove();
			check(e.pageY, e.pageX, true);
			body.css('cursor', '');
			callback && callback(initIndex, moveNode.index());
		}
		moveFlag = false;
	}

	//注册事件监听=>改成给容器手动添加事件
	//params => {dashClass,targetClass,dragClass}
	$.fn.addDragEvent = function (params, callbackFn) {
		if (eventBox) {
			eventBox.off('mousedown', classMsg.dragClass, mousedown);
		}
		classMsg.dashClass = params.dashClass;
		classMsg.targetClass = params.targetClass;
		classMsg.dragClass = params.dragClass;
		classMsg.boxClass = params.boxClass;
		callback = callbackFn;
		eventBox = $(this);
		$(this).on("mousedown", classMsg.dragClass, mousedown);//mousedown的时候添加dashBox
	};
	(function eventListening() {
		$(document).on("mousemove", mousemove).on("mouseup", mouseup);
	}());
}(jQuery));

/*节点操作*/
(function ($) {
	/*定义全局组件*/
	$(function () {
		$('body').on('click', '.copy-select', function () {
			var self = $(this);
			var offset = self.offset();
			var width = self.outerWidth();
			var height = self.height();
			var options = [];
			if (self.data('num')) {
				var num = self.data('num');
				options = ['不限'];
				for (var x = 0; x < num; x++) {
					options.push((x + 1) + '项');
				}
			} else {
				options = self.data('options');
			}
			var nodeText = '<div class="copy-select-options">';
			$.each(options, function (index, value) {
				nodeText += '<div>' + value + '</div>';
			})
			var top = height + 5 + offset.top
			var node = $(nodeText + '</div>').css({ left: offset.left, top: top, width: width });
			$('body').append(node);
			node.children().click(function () {
				var html = $(this).html();
				self.find('.copy-select-show').html(html);
				self.trigger('change', [html]);
			})
			window.setTimeout(function () {
				$('body').one('click', function () {
					node.remove();
				});
			}, 20);
		});

		var optionsModal = $('.options-modal');
		var editor = $('.modal-editor textarea');
		var callbackFn = undefined;

		function showOptionsModal(content, callback) {
			editor.val(content || '');
			callbackFn = callback;
			optionsModal.show();
		}

		$.showOptionsModal = showOptionsModal;

		/*弹出框操作*/
		$('.options-modal .modal-cancel').click(function () {
			optionsModal.hide();
		})

		/*弹出框确认*/
		$('.modal-btn-group .primary-btn').click(function () {
			callbackFn && callbackFn(editor.val());
			optionsModal.hide();
		});
	})

	/**
	 * 初始化题目编辑选项
	 *
	 * @param {Array} array 题目数组
	 * @param {Number} index 题目数组索引
	 * @return
	 */
	function addEditOperate(array, index) {
		var item = $(this).find('.edit-content-item');
		var type = array[index].type;
		if (type === 'singleSelect' || type === 'multipleSelect') {
			item.append($('#question-select-edit').children().clone().show()).initSelectOperate(array, index);
		} else if (type === 'singleText' || type === 'multipleText') {
			item.append($('#question-text-edit').children().clone().show()).initTextOperate(array, index);
		} else if (type === 'score') {
			item.append($('#question-score-edit').children().clone().show()).initScoreOperate(array, index);
		} else if (type === 'file') {
			item.append($('#question-file-edit').children().clone().show()).initFileOperate(array, index);
		} else {
			item.append($('#question-image-edit').children().clone().show()).initImageOperate(array, index);
		}
	}


	/**
	 * 初始化题目编辑选项操作(单选或多选题)
	 *
	 * @param {Array} array 题目数组
	 * @param {Number} index 题目数组索引
	 * @return
	 */
	function initSelectOperate(array, index) {
		/*关键节点*/
		/*选项容器*/
		var _self = $(this);
		var optionsBox = _self.find('.config-options-box');
		var contentShowBox = _self.find('.show-box-cont');
		var toggleSourceEl = _self.find('.edit-setting-toggle');
		var addSourceEl = _self.find('.config-options-add');
		var showTitle = _self.find('.edit-item-title');
		var showTips = _self.find('.show-box-msg');
		var otherOptionEl = _self.find('.config-options-else');
		var necessaryCheckbox = _self.find('.setting-left input:eq(0)');
		var resultShowCheckbox = _self.find('.setting-left input:eq(1)');
		var isEvaluateCheckbox = _self.find('.setting-left input:eq(2)');
		var lineEachInput = _self.find('.setting-right .copy-select-show:eq(0)');
		var orderTypeInput = _self.find('.setting-right .copy-select-show:eq(1)');
		var scoreInput = _self.find('.setting-right input:eq(0)');

		var currentItem = array[index];
		var width = calcWidth(currentItem.lineEach);
		var type = currentItem.type;
		var inputId = type === 'singleSelect' ? '#question-single-select-option' : '#question-multiple-select-option';
		var inputClass = type === 'singleSelect' ? 'icon-single' : 'icon-multiple'

		/*初始化编辑框选项*/
		var options = $(currentItem.options)
		updateEditOptions(options, true);

		/*初始化编辑框标题*/
		var editTitleInput = $('.config-item-input input:eq(0)').val(currentItem.title);
		/*初始化编辑框说明*/
		var editTipsInput = $('.config-item-input input:eq(1)').val(currentItem.tips);

		necessaryCheckbox.prop('checked', currentItem['necessary']);
		// $('.edit-red').toggle(currentItem['necessary']);
		resultShowCheckbox.prop('checked', currentItem['resultShow']);
		isEvaluateCheckbox.prop('checked', currentItem['isEvaluate']);
		lineEachInput.html(currentItem['lineEach']);
		orderTypeInput.html(currentItem['orderType']);
		scoreInput.val(currentItem['score']);
		toggleSourceEl.data('show', !currentItem['moreOperateShow']);
		otherOptionEl.toggle(currentItem['hasOther']);
		toggleMore();
		toggleMore2();

		/*给目标节点添加拖拽功能*/
		optionsBox.addDragEvent({
			dashClass: '.config-item-dash',
			targetClass: '.config-item2',
			dragClass: '.config-item-abs-drag',
			boxClass: '.config-options-box'
		}, initOptions);

		/*切换更多*/
		function toggleMore(bool) {
			var self = toggleSourceEl;
			var parent = self.parents('.edit-content-item');
			var settingBox = parent.find('.setting-box');
			if (bool) {
				var isShow = self.data('show');
				parent.find('.config-item-abs-drag').toggle(isShow);
				parent.find('.config-radio-box').toggle(isShow);
			} else {
				if (self.data('show')) {
					settingBox.css({ height: settingBox.data('height') })
					self.data('show', false);
					self.removeClass(self.data('class'));
					parent.find('.config-item-abs-drag').hide();
				} else {
					settingBox.css({ height: 'unset' })
					self.data('show', true);
					self.addClass(self.data('class'));
					parent.find('.config-item-abs-drag').show();
				}
			}
		}

		/*切换是否评测*/
		function toggleMore2() {
			var bool = isEvaluateCheckbox.prop('checked');
			_self.find('.options-abs-config').toggle(bool);
			_self.find('.config-radio-box').toggle(bool);
			_self.find('.setting-right-item:eq(2)').toggle(bool);
		}

		isEvaluateCheckbox.change(toggleMore2);

		toggleSourceEl.click(function () {
			toggleMore();
		});

		/*初始化选项*/
		function initOptions() {
			optionsBox.find('.config-item-short-input').each(function (index) {
				$(this).attr('placeholder', '选项' + (index + 1));
			});
			updateShow();
		}

		/*添加option*/
		function addOption() {
			return $(inputId).children().clone().appendTo(optionsBox);
		}

		/*添加option*/
		addSourceEl.click(function () {
			addOption();
			initOptions();
		});
		/*移除option*/
		optionsBox.on('click', '.icon-remove', function () {
			$(this).parents('.config-item2').remove();
			initOptions();
		});
		/*选项批量编辑*/
		$('.operate-change').click(function () {
			var options = (function () {
				var arr = [];
				optionsBox.find('.config-item-short-input').each(function () {
					arr.push($(this).val());
				});
				return arr;
			}());
			$.showOptionsModal(options.join('\n'), function (val) {
				var options = val.split('\n');
				updateEditOptions(options);
			});
		});

		/*更新编辑部分的输入项*/
		function updateEditOptions(options, isInit) {
			optionsBox.html('');
			$.each(options, function (index, item) {
				var node = addOption();
				node.find('.config-item-short-input').val(isInit ? item.content : item);
				isInit && node.find('.config-radio-box input').prop('checked', item.isCorrect);
			})
			initOptions();
			toggleMore(true);
			updateShow();
		}

		/*添加'其他'选项*/
		$('.operate-add-else').click(function () {
			otherOptionEl.toggle();
		});

		/*实时更新预览*/
		function updateShow() {
			contentShowBox.html('');
			var html = '';
			optionsBox.find('.config-item2').each(function () {
				var self = $(this);
				var val = self.find('.config-item-short-input').val();
				var checked = self.find('.config-radio-box input').prop('checked');
				html += '<div class="show-cont-item"' + 'style="width:' + width + '"' +
					'><div class="' + inputClass + (checked ? (' ' + inputClass + '-light') : '') + '"></div><span>' + val + '</span></div>';
			});
			contentShowBox.html(html);
		}

		optionsBox.on('keyup', 'input.config-item-short-input', function () {
			updateShow();
		}).on('change', '.config-radio-box input', function () {
			updateShow();
		})
		/*必填更新*/
		necessaryCheckbox.change(function () {
			$('.edit-red').toggle($(this).prop('checked'));
		});
		/*显示行数*/
		$('.copy-select.line-show').on('change', function (e, value) {
			width = calcWidth(value);
			$('.show-cont-item').css({ width: width });
		});

		/*编辑标题*/
		editTitleInput.keyup(function () {
			showTitle.html($(this).val());
		});
		/*编辑说明*/
		editTipsInput.keyup(function () {
			var val = $(this).val();
			showTips.html(val).toggle(!!val);
		});
		/*取消*/
		$('.edit-btn-group .sub-btn').click(function () {
			window.state.closeEdit();
		});
		/*确认提交*/
		$('.edit-btn-group .primary-btn').click(function () {
			currentItem['title'] = editTitleInput.val();
			currentItem['tips'] = editTipsInput.val();
			currentItem['hasOther'] = otherOptionEl.css('display') !== 'none';
			currentItem['necessary'] = necessaryCheckbox.prop('checked');
			currentItem['resultShow'] = resultShowCheckbox.prop('checked');
			currentItem['isEvaluate'] = isEvaluateCheckbox.prop('checked');
			currentItem['lineEach'] = lineEachInput.html();
			currentItem['orderType'] = orderTypeInput.html();
			currentItem['score'] = scoreInput.val();
			currentItem['moreOperateShow'] = toggleSourceEl.data('show');
			currentItem['options'] = (function () {
				var arr = [];
				optionsBox.find('.config-item2').each(function () {
					var self = $(this);
					var val = self.find('.config-item-short-input').val();
					var checked = self.find('.config-radio-box input').prop('checked');
					if (val) {
						arr.push({
							content: val,
							isCorrect: checked
						})
					}
				});
				return arr;
			}());
			window.state.closeEdit();
		});
	}


	/**
	 * 初始化题目编辑选项操作(文本)
	 *
	 * @param {Array} array 题目数组
	 * @param {Number} index 题目数组索引
	 * @return
	 */
	function initTextOperate(array, index) {
		/*关键节点*/
		/*选项容器*/
		var _self = $(this);
		var showTitle = _self.find('.edit-item-title');
		var showTips = _self.find('.show-box-msg');
		var necessaryCheckbox = _self.find('.setting-box-item input:eq(0)');
		var limitBox = _self.find('.setting-box-item .copy-select-show:eq(0)');
		var minSizeBox = _self.find('.setting-box-item:eq(2) input');
		var maxSizeBox = _self.find('.setting-box-item:eq(3) input');

		var currentItem = array[index];
		var isMultiple = currentItem['type'] === 'multiple';

		if (isMultiple) {
			_self.find('.setting-box-item:eq(1)').hide();
		}

		/*初始化选项*/
		necessaryCheckbox.prop('checked', currentItem['necessary']);
		isMultiple || limitBox.html(currentItem['limitType']);
		minSizeBox.val(currentItem['maxSize']);
		maxSizeBox.val(currentItem['minSize']);
		/*初始化编辑框标题*/
		var editTitleInput = $('.config-item-input input:eq(0)').val(currentItem.title);
		/*初始化编辑框说明*/
		var editTipsInput = $('.config-item-input input:eq(1)').val(currentItem.tips);


		/*必填更新*/
		necessaryCheckbox.change(function () {
			$('.edit-red').toggle($(this).prop('checked'));
		});

		/*编辑标题*/
		editTitleInput.keyup(function () {
			showTitle.html($(this).val());
		});
		/*编辑说明*/
		editTipsInput.keyup(function () {
			var val = $(this).val();
			showTips.html(val).toggle(!!val);
		});

		/*取消*/
		$('.edit-btn-group .sub-btn').click(function () {
			window.state.closeEdit();
		});

		/*确认提交*/
		$('.edit-btn-group .primary-btn').click(function () {
			currentItem['title'] = editTitleInput.val();
			currentItem['tips'] = editTipsInput.val();
			currentItem['necessary'] = necessaryCheckbox.prop('checked');
			isMultiple || (currentItem['limitType'] = limitBox.html());
			currentItem['maxSize'] = minSizeBox.val();
			currentItem['minSize'] = maxSizeBox.val();
			window.state.closeEdit();
		});
	}


	/**
	 * 初始化题目编辑选项操作(图片题)
	 *
	 * @param {Array} array 题目数组
	 * @param {Number} index 题目数组索引
	 * @return
	 */
	function initImageOperate(array, index) {
		/*关键节点*/
		/*选项容器*/
		var _self = $(this);
		var showTitle = _self.find('.edit-item-title');
		var showTips = _self.find('.show-box-msg');
		var toggleSourceEl = _self.find('.edit-setting-toggle');
		var necessaryCheckbox = _self.find('.setting-left input:eq(0)');
		var resultShowBox = _self.find('.setting-left input:eq(1)');
		var switchBox = _self.find('.switch-box');
		var sortBox = _self.find('.setting-right-item .copy-select-show:eq(2)');
		var minBox = _self.find('.setting-right-item .copy-select-show:eq(0)');
		var maxBox = _self.find('.setting-right-item .copy-select-show:eq(1)');
		var editImageBox = _self.find('.edit-image-box');
		var showNumBox = editImageBox.find('span');
		var uploadBox = _self.find('.edit-image-box .image-add input');
		var uploadBoxContainer = _self.find('.edit-config .image-add');
		var showImageBox = _self.find('.show-box-cont');
		var multipleSelectBox = _self.find('.setting-multiple');


		var currentItem = array[index];
		var _maxSize = 32;
		var options = currentItem.options.slice(0);

		/*初始化选项*/
		necessaryCheckbox.prop('checked', currentItem['necessary']);
		resultShowBox.prop('checked', currentItem['resultShow']);
		sortBox.html(currentItem['orderType']);
		var minSize = currentItem['minSize'];
		var maxSize = currentItem['maxSize'];
		minBox.html(minSize ? minSize + '项' : '不限');
		maxBox.html(maxSize ? maxSize + '项' : '不限');
		toggleSourceEl.data('show', !currentItem['moreOperateShow']);
		toggleMore();
		/*初始化编辑框标题*/
		var editTitleInput = $('.config-item-input input:eq(0)').val(currentItem.title);
		/*初始化编辑框说明*/
		var editTipsInput = $('.config-item-input input:eq(1)').val(currentItem.tips);
		var isMultiple = !currentItem['isSingle'];
		updateSwitch();
		updateEditBox();
		showNumBox.html(currentItem.options.length);

		switchBox.find('.switch-item').click(function () {
			switchBox.find('.switch-on').removeClass('switch-on');
			$(this).addClass('switch-on');
			switchRadioType();
		})

		function switchRadioType() {
			isMultiple = switchBox.find('.switch-on').index() === 0;
			multipleSelectBox.toggle(isMultiple);
			if (isMultiple) {
				editImageBox.find('.img-label input').attr('type', 'checkbox');
				showImageBox.find('.icon-single-light').attr('class', 'icon-multiple icon-multiple-light');
				showImageBox.find('.icon-single').attr('class', 'icon-multiple');
			} else {
				editImageBox.find('.img-label input').attr('type', 'radio');
				showImageBox.find('.icon-multiple').attr('class', 'icon-single');
			}
		}

		function updateSwitch() {
			switchBox.find('.switch-on').removeClass('switch-on');
			switchBox.find('.switch-item').eq(isMultiple ? 0 : 1).addClass('switch-on');
			switchRadioType();
		}

		function updateEditBox() {
			var type = isMultiple ? 'checkbox' : 'radio';
			$.each(currentItem.options, function (index, value) {
				var html1 = '<label class="show-image-item"><img src="' + value.source +
					'"><div class="img-label"><input type="' + type +
					'" name="imageRadio"' + (value.isCorrect ? 'checked' : '') +
					'><textarea class="img-msg" placeholder="请输入图片名称" >' + value.label + '</textarea></div><div class="image-abs-close"></div></label>';
				uploadBoxContainer.before($(html1));
			})
		}

		uploadBox.change(function (e) {
			var files = e.target.files;
			var filesLength = files.length;
			if (filesLength > _maxSize - options.length) {
				alert('图片总数量大于' + _maxSize);
				return;
			}
			var count = 0;
			$.each(files, function (i, file) {
				file2base64(file).then(function (base64) {
					var html1 = '<label class="show-image-item"><img src="' + base64 +
						'"><div class="img-label"><input type="' + (isMultiple ? 'checkbox' : 'radio') +
						'" name="imageRadio"><textarea class="img-msg" placeholder="请输入图片名称"></textarea></div><div class="image-abs-close"></div></label>';
					var html2 = '<div class="show-image-item"><img src="' + base64 +
						'"><div class="img-label"><div class="img-msg"></div><div class="img-label-abs"><div class="' + (isMultiple ? 'icon-multiple' : 'icon-single') +
						'"></div></div></div></div>';
					uploadBoxContainer.before($(html1));
					showImageBox.append($(html2));
					options.push({ source: base64, file: file, label: '' });
					if (filesLength === ++count) {
						updateImageStatus()
					}
				})
			})
		})

		/*编辑监听*/
		editImageBox.on('keyup', 'textarea', function () {
			var index = $(this).parents('.show-image-item').index();
			var val = options[index].label = $(this).val();
			showImageBox.find('.show-image-item').eq(index).find('.img-msg').html(val);
		});

		/*选中监听*/
		editImageBox.on('change', '.img-label input', function () {
			var index = $(this).parents('.show-image-item').index();
			if (!isMultiple) {
				showImageBox.find('.icon-single-light').removeClass('icon-single-light');
				showImageBox.find('.show-image-item').eq(index).find('.icon-single').addClass('icon-single-light');
			} else {
				var bool = $(this).prop('checked');
				var method = bool ? 'addClass' : 'removeClass';
				showImageBox.find('.show-image-item').eq(index).find('.icon-multiple')[method]('icon-multiple-light');
			}
		});

		/*移除的监听*/
		editImageBox.on('click', '.image-abs-close', function () {
			var parent = $(this).parents('.show-image-item');
			var index = parent.index();
			options.splice(index, 1);
			parent.remove();
			showImageBox.find('.show-image-item').eq(index).remove();
			updateImageStatus()
		});


		function updateImageStatus() {
			showNumBox.html(options.length);
			if (options.length === maxSize) {
				uploadBoxContainer.hide();
			}
		}

		/*切换更多*/
		function toggleMore() {
			var self = toggleSourceEl;
			var parent = self.parents('.edit-content-item');
			var settingBox = parent.find('.setting-box');
			if (self.data('show')) {
				settingBox.css({ height: settingBox.data('height') })
				self.data('show', false);
				self.removeClass(self.data('class'));
			} else {
				settingBox.css({ height: 'unset' })
				self.data('show', true);
				self.addClass(self.data('class'));
			}
		}

		toggleSourceEl.click(function () {
			toggleMore();
		});

		/*必填更新*/
		necessaryCheckbox.change(function () {
			$('.edit-red').toggle($(this).prop('checked'));
		});

		/*编辑标题*/
		editTitleInput.keyup(function () {
			showTitle.html($(this).val());
		});
		/*编辑说明*/
		editTipsInput.keyup(function () {
			var val = $(this).val();
			showTips.html(val).toggle(!!val);
		});

		/*取消*/
		$('.edit-btn-group .sub-btn').click(function () {
			window.state.closeEdit();
		});

		/*确认提交*/
		$('.edit-btn-group .primary-btn').click(function () {
			currentItem['title'] = editTitleInput.val();
			currentItem['tips'] = editTipsInput.val();
			currentItem['necessary'] = necessaryCheckbox.prop('checked');
			currentItem['isSingle'] = switchBox.find('.switch-on').index() === 1;
			currentItem['orderType'] = sortBox.html();
			currentItem['resultShow'] = resultShowBox.prop('checked');
			currentItem['moreOperateShow'] = toggleSourceEl.data('show');
			currentItem['options'] = options;
			if (isMultiple) {
				var minHtml = minBox.html();
				var maxHtml = maxBox.html();
				console.log(minHtml);
				currentItem['minSize'] = minHtml === '不限' ? 0 : parseInt(minHtml.slice(0, -1));
				currentItem['maxSize'] = maxHtml === '不限' ? 0 : parseInt(maxHtml.slice(0, -1));
			}

			window.state.closeEdit();
		});
	}


	/**
	 * 初始化题目编辑选项操作(分数)
	 *
	 * @param {Array} array 题目数组
	 * @param {Number} index 题目数组索引
	 * @return
	 */
	function initScoreOperate(array, index) {
		/*关键节点*/
		/*选项容器*/
		var _self = $(this);
		var showTitle = _self.find('.edit-item-title');
		var showTips = _self.find('.show-box-msg');
		var showScore = _self.find('.show-box-cont .subject-score');
		var necessaryCheckbox = _self.find('.setting-box-item input:eq(0)');
		var minSizeBox = _self.find('.setting-box-item:eq(1) .copy-select-show');
		var minSelect = minSizeBox.parent();
		var maxSizeBox = _self.find('.setting-box-item:eq(2) .copy-select-show');
		var maxSelect = maxSizeBox.parent();
		var scoreBox = _self.find('.edit-image-box .subject-score');

		var currentItem = array[index];

		/*初始化选项*/
		necessaryCheckbox.prop('checked', currentItem['necessary']);
		var max = currentItem['maxSize'];
		var min = currentItem['minSize'];
		minSizeBox.html(min);
		maxSizeBox.html(max);
		/*初始化编辑框标题*/
		var editTitleInput = $('.config-item-input input:eq(0)').val(currentItem.title);
		/*初始化编辑框说明*/
		var editTipsInput = $('.config-item-input input:eq(1)').val(currentItem.tips);
		updateScore();

		function updateScore() {
			var maxValue = Number(max);
			var minValue = Number(min);
			var diff = maxValue - minValue + 1;
			for (var i = 0; i < 10; i++) {
				var isLight = i < 1;
				if (isLight) {
					scoreBox.find('div').eq(i).addClass('star-light');
					showScore.find('div').eq(i).addClass('star-light');
				} else {
					if (i < diff) {
						scoreBox.find('div').eq(i).removeClass('star-light').show();
						showScore.find('div').eq(i).removeClass('star-light').show();
					} else {
						scoreBox.find('div').eq(i).removeClass('star-light').hide();
						showScore.find('div').eq(i).removeClass('star-light').hide();
					}
				}
			}
		}

		maxSelect.change(function (e, data) {
			max = data;
			updateScore();
			var arr = [];
			for (var i = 1; i <= Number(max); i++) {
				arr.push(i);
			}
			minSelect.data('options', arr);
		})

		minSelect.change(function (e, data) {
			min = data;
			updateScore();
			var arr = [];
			for (var i = Number(min); i <= 10; i++) {
				arr.push(i);
			}
			maxSelect.data('options', arr);
		})


		/*必填更新*/
		necessaryCheckbox.change(function () {
			$('.edit-red').toggle($(this).prop('checked'));
		});

		/*编辑标题*/
		editTitleInput.keyup(function () {
			showTitle.html($(this).val());
		});
		/*编辑说明*/
		editTipsInput.keyup(function () {
			var val = $(this).val();
			showTips.html(val).toggle(!!val);
		});

		/*取消*/
		$('.edit-btn-group .sub-btn').click(function () {
			window.state.closeEdit();
		});

		/*确认提交*/
		$('.edit-btn-group .primary-btn').click(function () {
			currentItem['title'] = editTitleInput.val();
			currentItem['tips'] = editTipsInput.val();
			currentItem['necessary'] = necessaryCheckbox.prop('checked');
			currentItem['minSize'] = min;
			currentItem['maxSize'] = max;
			window.state.closeEdit();
		});
	}


	/**
	 * 初始化题目编辑选项操作(附件)
	 *
	 * @param {Array} array 题目数组
	 * @param {Number} index 题目数组索引
	 * @return
	 */
	function initFileOperate(array, index) {
		/*关键节点*/
		/*选项容器*/
		var _self = $(this);
		var showTitle = _self.find('.edit-item-title');
		var showTips = _self.find('.show-box-msg');
		var showBar = _self.find('.upload-box span');
		var necessaryCheckbox = _self.find('.setting-box-item input:eq(0)');
		var maxSizeBox = _self.find('.setting-box-item:eq(1) .copy-select-show');

		var currentItem = array[index];

		/*初始化选项*/
		necessaryCheckbox.prop('checked', currentItem['necessary']);
		maxSizeBox.html(currentItem['maxSize']);
		/*初始化编辑框标题*/
		var editTitleInput = $('.config-item-input input:eq(0)').val(currentItem.title);
		/*初始化编辑框说明*/
		var editTipsInput = $('.config-item-input input:eq(1)').val(currentItem.tips);
		updateScore(currentItem['max']);

		function updateScore(max) {
			var text = '上传文件（最多上传{{}}个文件，100M以内）'.replace('{{}}', max);
			showBar.html(text);
		}

		_self.find('.setting-box-item:eq(1) .copy-select').change(function (e, value) {
			updateScore(value);
		})


		/*必填更新*/
		necessaryCheckbox.change(function () {
			$('.edit-red').toggle($(this).prop('checked'));
		});

		/*编辑标题*/
		editTitleInput.keyup(function () {
			showTitle.html($(this).val());
		});
		/*编辑说明*/
		editTipsInput.keyup(function () {
			var val = $(this).val();
			showTips.html(val).toggle(!!val);
		});

		/*取消*/
		$('.edit-btn-group .sub-btn').click(function () {
			window.state.closeEdit();
		});

		/*确认提交*/
		$('.edit-btn-group .primary-btn').click(function () {
			currentItem['title'] = editTitleInput.val();
			currentItem['tips'] = editTipsInput.val();
			currentItem['necessary'] = necessaryCheckbox.prop('checked');
			currentItem['maxSize'] = maxSizeBox.html();
			window.state.closeEdit();
		});
	}

	$.fn.addEditOperate = addEditOperate;
	$.fn.initSelectOperate = initSelectOperate;
	$.fn.initTextOperate = initTextOperate;
	$.fn.initScoreOperate = initScoreOperate;
	$.fn.initFileOperate = initFileOperate;
	$.fn.initImageOperate = initImageOperate;


}(jQuery));

/*问题类型集合*/
window.questionCollection = {
	singleSelect: {
		type: 'singleSelect',
		necessary: false,
		hasOther: false,
		title: '',
		titlePlace: '单选题',
		contentPlace: '选项',
		tips: '',
		options: [
			{
				isCorrect: false,
				content: '选项'
			},
			{
				isCorrect: false,
				content: '选项'
			},
		],
		moreOperateShow: false,
		resultShow: false,
		isEvaluate: false,
		lineEach: '1',
		orderType: '原始排序',
		score: ''
	},
	multipleSelect: {
		type: 'multipleSelect',
		necessary: false,
		hasOther: false,
		title: '',
		titlePlace: '多选题',
		contentPlace: '选项',
		tips: '',
		options: [
			{
				isCorrect: false,
				content: '选项'
			},
			{
				isCorrect: false,
				content: '选项'
			},
		],
		moreOperateShow: false,
		resultShow: false,
		isEvaluate: false,
		lineEach: '1',
		orderType: '原始排序',
		score: ''
	},
	singleText: {
		type: 'singleText',
		necessary: false,
		title: '',
		titlePlace: '单行文本提',
		tips: '',
		limitType: '不限',
		maxSize: '',
		minSize: ''
	},
	multipleText: {
		type: 'multipleText',
		necessary: false,
		title: '',
		titlePlace: '多行文本题',
		tips: '',
		maxSize: '',
		minSize: ''
	},
	image: {
		isSingle: true,
		type: 'image',
		necessary: false,
		title: '',
		titlePlace: '图片题【单选】',
		tips: '',
		moreOperateShow: false,
		resultShow: false,
		orderType: '原始排序',
		minSize: 0,
		maxSize: 0,
		options: []
	},
	score: {
		type: 'score',
		necessary: false,
		title: '',
		titlePlace: '打分题',
		tips: '',
		minSize: '1',
		maxSize: '10'
	},
	file: {
		type: 'file',
		necessary: false,
		title: '',
		titlePlace: '附件题',
		tips: '',
		maxSize: '1'
	}
}

function getQuestion(type) {
	return $.extend(true, {}, window.questionCollection[type]);
}


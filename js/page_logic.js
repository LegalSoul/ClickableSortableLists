const CONFIG = {
	expandAutoCloseSeconds: 10,
	pixelsDistanceToStartDrag: 5,
	sortableAnimationDuration: 200,
	expansionAnimationDuration: 100,
	yExpansion: 50,
	xExpansion: 100
};

var expandedDefaultVals = {};
var lastMovedIndex = null;
var originalSublistLength = null;
var isBeingDragged = null;

$( document ).ready(function() {

	initializedSortables();
	initializeHelpers();
	initializeOverlayLogic();
});

function initializedSortables() {
	const sortableOptions = {
		group: 'list',
		animation: CONFIG.sortableAnimationDuration,
		ghostClass: 'ghost',
		onSort: reorderEndedActions,
		onStart: startDragActions,
		onEnd: endDragActions,
		filter: ".locked,.invisible-lock",
		fallbackTolerance: CONFIG.pixelsDistanceToStartDrag,
		fallbackOnBody: true,
		forceFallback: true,
		swapThreshold: 0.65
	}
	// level1 lists
	$(".container-lvl-1").sortable(sortableOptions);

	sortableOptions.group = {name: 'list', pull: true, put: false};
	sortableOptions.sort = true;
	sortableOptions.onChoose = itemChosenActions;
	sortableOptions.onUnchoose = itemUnchosenActions;
	sortableOptions.onMove = itemMovedActions;
	// sortableOptions.swapThreshold= 0.0;	

	// level 2 lists
	$(".container-lvl-2").sortable(sortableOptions);

};


function reorderEndedActions(evt) {
	removeCollapseButtonIfEmpty(evt);

	console.log("The sort order has changed");
};

function endDragActions() {
	setTimeout(function() {
		// console.log("end drag");
		isBeingDragged = false;
	}, 5);
}

function startDragActions() {
	isBeingDragged = true;
}

function initializeHelpers() {
	$(".collapse-toggle").on("click touch", function(event) {
		event.preventDefault();
		const theItem = $(this).parent();
		const clickedButton = $(this);

		theItem.toggleClass("collapsed");
		if (clickedButton.attr("data-action") == "collapse") {
			clickedButton.attr("data-action", "expand");
		} else {
			clickedButton.attr("data-action", "collapse");
		}
		theItem.find(".nested-sortable").stop().toggle("fast");
	});

	$(".disabled-children-drag > .list-group-item:not(.locked)").addClass("locked");
}

function initializeOverlayLogic() {
	$(".overlay-helper").on("click touch", function(event) {
		event.preventDefault();
		closePreviousOverlay();
	});

	$(".list-group").on("click touch", function(event) {
		event.preventDefault();
		if ($(event.target).hasClass("item-contents")) {
			return;
		}
		if (anyElementExpanded()) {
			closePreviousOverlay();
		}
	});

	$(".item-contents:not(.overlayed)").on("click touch", function(event) {
		// console.log("clicked");
		if (isBeingDragged) return;
		event.preventDefault();
		if ($(this).parent().hasClass("sortable-chosen")) return;
		if (anyElementExpanded()){
			closePreviousOverlay();
			return;
		}

		const clickedElement = $(this);
		$(".overlay-helper").show();
		clickedElement.parent().addClass("invisible-lock");
		const clonedElement = clickedElement.clone().addClass("overlayed overlay-props");

		const timeoutId = setTimeout(function(){
			closePreviousOverlay();
		}, CONFIG.expandAutoCloseSeconds * 1000);

		backupOriginalSizeValues(clickedElement, clonedElement, timeoutId);
		handleElementExpansion(clickedElement, clonedElement);

	});

}

function backupOriginalSizeValues(clickedElement, clonedElement, timeoutId) {
	expandedDefaultVals = {
		expandedObject: clonedElement,
		originalHeight: clickedElement.outerHeight(),
		originalWidth: clickedElement.outerWidth(),
		originalTopPadding: parseInt(clickedElement.css("padding-top")),
		originalLeftPadding: parseInt(clickedElement.css("padding-left")),
		lastTimeoutId: timeoutId
	};
}

function handleElementExpansion(clickedElement, clonedElement) {
	clonedElement.css("background-color", clickedElement.css("background-color"));
	// original values
	clonedElement.css("height", expandedDefaultVals.originalHeight + "px");
	clonedElement.css("width", expandedDefaultVals.originalWidth + "px");
	clonedElement.css("padding-top", expandedDefaultVals.originalTopPadding + "px");
	clonedElement.css("padding-bottom", expandedDefaultVals.originalTopPadding + "px");
	clonedElement.css("padding-left", expandedDefaultVals.originalLeftPadding + "px");
	clonedElement.css("padding-right", expandedDefaultVals.originalLeftPadding + "px");
	clonedElement.css("top", 0);
	clonedElement.css("left", 0);

	// animated values
	clonedElement.animate({
		height: expandedDefaultVals.originalHeight + (2 * CONFIG.yExpansion) + "px",
		width: expandedDefaultVals.originalWidth + (2 * CONFIG.xExpansion) + "px",
		paddingTop: expandedDefaultVals.originalTopPadding + CONFIG.yExpansion + "px",
		paddingBottom: expandedDefaultVals.originalTopPadding + CONFIG.yExpansion + "px",
		paddingLeft: expandedDefaultVals.originalLeftPadding + CONFIG.xExpansion + "px",
		paddingRight: expandedDefaultVals.originalLeftPadding + CONFIG.xExpansion + "px",
		top: -CONFIG.yExpansion + "px",
		left: -CONFIG.xExpansion + "px"
	}, CONFIG.expansionAnimationDuration);
	
	clonedElement.insertAfter(clickedElement);
}

function itemMovedActions(evt) {
	// console.log("moved");
	var proposedIndex = Sortable.utils.index(evt.related, '.list-group-item');
	var currentSublistLength = $(evt.to).children().length;
	var originalContainerIsLarger = originalSublistLength == (currentSublistLength + 1);
	var futurePosition = proposedIndex + (evt.willInsertAfter && originalContainerIsLarger ? 1 : 0);
	if (currentSublistLength == 0) futurePosition--;

	// reject if moved within parent but not to the old position
	if (evt.from == evt.to && futurePosition !== lastMovedIndex) return false;	
}

function itemChosenActions(evt) {
	lastMovedIndex = evt.oldIndex;
	originalSublistLength = $(evt.from).children().length;
	// console.log("chosen");
}

function itemUnchosenActions(evt) {
	// console.log("unchosen");
}

function closePreviousOverlay() {
	if (!expandedDefaultVals.expandedObject) return;
	if (!anyElementExpanded()) return;
	// console.log("closing");
	expandedDefaultVals.expandedObject.removeClass("overlayed");
	expandedDefaultVals.expandedObject.animate({
		height: expandedDefaultVals.originalHeight + "px",
		width: expandedDefaultVals.originalWidth + "px",
		paddingTop: expandedDefaultVals.originalTopPadding + "px",
		paddingBottom: expandedDefaultVals.originalTopPadding + "px",
		paddingLeft: expandedDefaultVals.originalLeftPadding + "px",
		paddingRight: expandedDefaultVals.originalLeftPadding + "px",
		top: 0,
		left: 0
	}, CONFIG.expansionAnimationDuration, function() {
		$(this).remove();
	});

	clearTimeout(expandedDefaultVals.lastTimeoutId);

	$(".overlay-helper").hide();
	$(".invisible-lock").removeClass("invisible-lock");
}

function anyElementExpanded() {
	return ($(".item-contents.overlayed").length > 0);
}

function removeCollapseButtonIfEmpty(evt) {
	const sourceSortable = $(evt.from);
	if (!sourceSortable) return;
	if (sourceSortable.children(".list-group-item").length <= 0) {
		$(sourceSortable).parent().find(".collapse-toggle").hide();
	}
}
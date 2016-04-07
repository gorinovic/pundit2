angular.module('Pundit2.AnnotationSidebar')

.controller('AnnotationDetailsCtrl', function($scope, $rootScope, $element, $timeout, $window,
    AnnotationSidebar, AnnotationDetails, AnnotationsExchange, TripleComposer, Dashboard, EventDispatcher,
    Config, MyPundit, Analytics, Item, AnnotationPopover, timeAgo) {

    var isDefined = function(a) {
        if (a === '' || typeof a === 'undefined') {
            return 0;
        } else {
            return a;
        }
    };
    // TODO: temporary fix waiting for server consistency
    if ($scope.motivation !== 'linking' &&
        $scope.motivation !== 'commenting' &&
        $scope.motivation !== 'replying') {
        $scope.motivation = 'linking';
    }

    if (AnnotationDetails.getAnnotationDetails($scope.id) === undefined) {
        AnnotationDetails.addAnnotationReference($scope);
    }

    var notebookId,
        currentId = $scope.id,
        currentElement = $element,
        initialHeight = AnnotationSidebar.options.annotationHeight,
        currentHeight = initialHeight - 1;

    var oneDay = 60 * 60 * 24;
    timeAgo.settings.fullDateAfterSeconds = oneDay;

    $scope.annotation = AnnotationDetails.getAnnotationDetails(currentId);

    //add standard social structure
    $scope.annotation.social = {
        counting: {
            comment: isDefined($scope.annotation.replies),
            like: isDefined($scope.annotation.likes),
            dislike: isDefined($scope.annotation.dislikes),
            endorse: isDefined($scope.annotation.endorses),
            report: isDefined($scope.annotation.reports)
        },
        status: {
            comment: ((typeof $scope.annotation.social === 'undefined') ? false : $scope.annotation.social.comment),
            like: ((typeof $scope.annotation.social === 'undefined') ? false : $scope.annotation.social.like),
            dislike: ((typeof $scope.annotation.social === 'undefined') ? false : $scope.annotation.social.dislike),
            endorse: ((typeof $scope.annotation.social === 'undefined') ? false : $scope.annotation.social.endorse),
            report: ((typeof $scope.annotation.social === 'undefined') ? false : $scope.annotation.social.report),
        }
    };
    $scope.annotation.parentId = $scope.id;
    $scope.annotation.repliesLoaded = undefined;
    $scope.annotation.replyDialog = false;
    $scope.annotation.editCommentValue = '';
    $scope.annotation.replyCommentValue = '';
    $scope.annotation.defaultThumb = false;
    $scope.annotation.edited = false;

    if ($scope.annotation.social.counting.comment === 0) {
        $scope.annotation.repliesLoaded = true;
    }

    if ($scope.annotation.thumbnail === '') {
        $scope.annotation.defaultThumb = true;
    }

    if ($scope.annotation.modified !== '') {
        $scope.annotation.edited = true;
    }

    $scope.replyTreeActivate = false;
    $scope.replyTree = [];
    $scope.editMode = false;
    $scope.isSaving = false;
    //options value
    $scope.social = AnnotationDetails.options.social;
    $scope.moreInfo = AnnotationDetails.options.moreInfo;
    $scope.reply = AnnotationDetails.options.reply;
    $scope.like = AnnotationDetails.options.like;
    $scope.dislike = AnnotationDetails.options.dislike;
    $scope.endorse = AnnotationDetails.options.endorse;
    $scope.report = AnnotationDetails.options.report;

    $scope.openGraph = Config.lodLive.baseUrl + Config.pndPurl + 'annotation/' + currentId;
    $scope.homePundit = Config.homePundit;
    $scope.userData = AnnotationDetails.userData();

    //set reply options
    $scope.options = AnnotationDetails.options;
    $scope.optionsReplyes = angular.copy($scope.options);
    $scope.optionsReplyes.parentAnnotation = $scope.annotation;
    $scope.optionsReplyes.like = $scope.options.replyLike;
    $scope.optionsReplyes.dislike = $scope.options.replyDislike;
    $scope.optionsReplyes.report = $scope.options.replyReport;
    $scope.optionsReplyes.endorse = $scope.options.replyEndorse;

    AnnotationDetails.addScopeReference($scope.id, $scope);


    if ($scope.options.replyTree === false) {
        $scope.optionsReplyes.reply = false;
    }

    if (typeof($scope.annotation) !== 'undefined') {
        $scope.notebooksHomeLink = Config.homeBaseURL + 'notebooks/';
        notebookId = $scope.annotation.notebookId;
    }

    if (typeof(Config.lodLive) !== 'undefined' && Config.lodLive.active) {
        $scope.lodLiveBaseUrl = Config.lodLive.baseUrl;
        $scope.lodLive = true;
    } else {
        $scope.lodLive = false;
    }

    if (typeof(Config.forceTemplateEdit) !== 'undefined' && Config.forceTemplateEdit) {
        $scope.forceTemplateEdit = true;
    } else {
        $scope.forceTemplateEdit = false;
    }

    if (typeof(Config.forceEditAndDelete) !== 'undefined' && Config.forceEditAndDelete) {
        $scope.forceEdit = true;
    } else {
        $scope.forceEdit = false;
    }

    var stopEvent = function(event) {
        event.stopPropagation();
        event.preventDefault();
    };

    $scope.checkLoaded = function() {

        if ($scope.annotation.repliesLoaded === false && $scope.social === true) {
            return true;
        }
        return false;
    };

    $scope.checkSaving = function() {

        if ($scope.annotation.repliesLoaded === false && $scope.social === true) {
            return true;
        }
        return false;
    };

    $scope.toggleAnnotation = function() {
        $scope.editMode = false;

        EventDispatcher.sendEvent('enableToggle');

        if (typeof $scope.annotation.repliesLoaded === 'undefined') {
            $scope.annotation.repliesLoaded = false;
        }

        if (!AnnotationSidebar.isAnnotationSidebarExpanded()) {
            if (AnnotationSidebar.isFiltersExpanded()) {
                AnnotationSidebar.toggleFiltersContent();
            }
            AnnotationSidebar.toggle();
            $timeout(function() {
                var dashboardHeight = Dashboard.isDashboardVisible() ? Dashboard.getContainerHeight() : 0;
                angular.element('body').animate({
                    scrollTop: currentElement.offset().top - dashboardHeight - 60
                }, 'slow');
            }, 100);
        }
        // if(AnnotationDetails.isAnnotationGhosted(currentId)){
        //     AnnotationDetails.closeViewAndReset();
        // }
        // $scope.metaInfo = false;
        AnnotationDetails.toggleAnnotationView(currentId);

        if (!$scope.annotation.expanded) {
            AnnotationSidebar.setAllPosition(currentId, initialHeight);
            $scope.annotation.replyDialog = false;
            $scope.annotation.replyCommentValue = '';
        } else {
            var screen = angular.element(window);
            setTimeout(function() {
                // TODO: add check for angular.element('.pnd-annotation-expanded')[0] 
                var el = angular.element('.pnd-annotation-expanded');
                var element = {};

                if (typeof el[0] === 'undefined') {
                    element.height = 100;
                    element.top = 0;
                } else {
                    element = el[0].getBoundingClientRect();
                }

                if ((element.height + element.top + 90 > screen.height()) || (element.top < 0)) {

                    angular.element('html,body').animate({
                            scrollTop: $window.scrollY + element.top - 65
                        },
                        'slow');
                }
            }, 600);
        }

        //if (!MyPundit.isUserLogged()){
        //    $scope.annotation.repliesLoaded = true;
        //}

        if ($scope.annotation.expanded && !$scope.annotation.repliesLoaded) {
            if (Config.modules.AnnotationDetails.social) {

                AnnotationDetails.getRepliesByAnnotationId(currentId).then(function(data) {
                    //TODO miss check comment.status in data
                    if (typeof data !== 'undefined') {
                        data.annotation = $scope.annotation;
                        data.annotation.social.counting.comment = data.length;
                        $scope.optionsReplyes.replyTreeArray = data;
                        $scope.annotation.repliesLoaded = true;
                        $scope.replyTree = AnnotationDetails.addRepliesReference($scope.annotation.parentId, data);
                    }

                    // console.log("data: " + data);

                });

            } else {
                $scope.annotation.repliesLoaded = true;
            }

        }

        Analytics.track('buttons', 'click', 'annotation--details--' + ($scope.annotation.expanded ? 'expand' : 'collapse'));
    };

    $scope.replyAnnotation = function(event) {
        $scope.annotation.replyDialog = !$scope.annotation.replyDialog;
        $scope.toggleAnnotation(event);
        stopEvent(event);
    };

    $scope.trackAnalyticsToggleEvent = function(label, expanded) {
        Analytics.track('buttons', 'click', 'annotation--details--' + label + '--' + (expanded ? 'expand' : 'collapse'));
    };

    $scope.trackAnalyticsEvent = function(label) {
        Analytics.track('buttons', 'click', 'annotation--details--' + label);
    };

    $scope.cAnnotation = function(event) {
        AnnotationDetails.openConfirmModal(currentElement, currentId);
        Analytics.track('buttons', 'click', 'annotation--details--delete');

        stopEvent(event);
    };

    $scope.showEdit = function() {
        return typeof($scope.annotation.hasTemplate) === 'undefined' || $scope.forceTemplateEdit;
    };

    $scope.editAnnotation = function(event) {

        var doEditAnnotation = function() {
            if (TripleComposer.isEditMode()) {
                TripleComposer.reset();
            }

            // TODO fix tripleComposer.editAnnotation removing watch to add statement and remove this timeout
            $timeout(function() {
                TripleComposer.editAnnotation($scope.annotation.id);
                if (!Dashboard.isDashboardVisible()) {
                    TripleComposer.closeAfterOp();
                    Dashboard.toggle();
                } else {
                    TripleComposer.closeAfterOpOff();
                }
                EventDispatcher.sendEvent('AnnotationDetails.editAnnotation', TripleComposer.options.clientDashboardTabTitle);

                Analytics.track('buttons', 'click', 'annotation--details--edit');
            }, 1);
            $scope.annotation.modified = new Date();
            $scope.annotation.edited = true;
        };

        if (TripleComposer.isSaving()) {
            // console.log("Still saving .. wait !!");
            TripleComposer.setAfterSave(doEditAnnotation);
        } else {
            doEditAnnotation();
        }

        stopEvent(event);
    };

    $scope.deleteAnnotation = function(event) {
        AnnotationDetails.openConfirmModal(currentElement, currentId);
        Analytics.track('buttons', 'click', 'annotation--details--delete');
        EventDispatcher.sendEvent('AnnotationDetails.deleteAnnotation', currentId);

        stopEvent(event);
    };

    $scope.editComment = function() {
        $scope.editMode = !$scope.editMode;
    };

    $scope.isEmpty = function() {

        if ($scope.annotation.replyCommentValue === '' && $scope.annotation.replyDialog === true) {
            EventDispatcher.sendEvent('disableToggle');
            return true;
        } else {
            EventDispatcher.sendEvent('enableToggle');
            return false;
        }
    };

    $scope.socialEvent = function(event, type) {
        var promise = {};

        if (type === 'comment') {
            $scope.annotation.replyDialog = false;
            $scope.isSaving = true;

            promise = AnnotationDetails.socialEvent(currentId, $scope.annotation.parentId, type, 'add', $scope.annotation.replyCommentValue);

            promise.then(function(data) {

                $scope.replyTreeActivate = true;
                $scope.isUserLogged = MyPundit.isUserLogged();
                $scope.userData = AnnotationDetails.userData();


                var currentUser = MyPundit.getUserData();

                var reply = {
                    id: data.AnnotationID,
                    parentId: $scope.id,
                    content: $scope.annotation.replyCommentValue,
                    creatorName: currentUser.fullName,
                    created: new Date(),
                    creator: $scope.userData.uri,
                    thumbnail: currentUser.thumbnail,
                    social: {
                        counting: {
                            comment: 0,
                            like: 0,
                            dislike: 0,
                            endorse: 0,
                            report: 0
                        },
                        status: {
                            comment: false,
                            like: false,
                            dislike: false,
                            endorse: false,
                            report: false
                        }
                    }
                };
                $scope.annotation.social.counting.comment = parseInt($scope.annotation.social.counting.comment) + 1;
                $scope.annotation.social.status.comment = true;
                $scope.annotation.replyCommentValue = '';
                $scope.replyTree = AnnotationDetails.addReplyReference($scope.annotation.parentId, data.AnnotationID, reply);
                $scope.isSaving = false;

            });
        }

        stopEvent(event);
    };

    $scope.saveEdit = function(event) {
        var promise = AnnotationDetails.saveEditedComment(currentId, $scope.annotation.itemsArray[0], $scope.annotation.comment);

        promise.then(function() {
            $scope.editMode = false;
            $scope.annotation.modified = new Date();
            $scope.annotation.edited = true;
        }, function() {});

        stopEvent(event);
    };

    $scope.areaClick = function(event) {
        stopEvent(event);
    };

    $scope.cancelEdit = function(event) {
        $scope.editMode = false;
        stopEvent(event);
    };

    $scope.cancelReply = function(event) {
        $scope.annotation.replyDialog = false;
        stopEvent(event);
    };

    $scope.openNotebook = function(event, id) {
        $window.open(Config.homeBaseURL + 'annotations/' + id, '_blank');
        stopEvent(event);
    };

    $scope.isUserToolShowed = function() {
        return AnnotationDetails.isUserToolShowed($scope.annotation.creator);
    };

    $scope.isLinking = function() {
        if ($scope.motivation === 'linking') {
            return true;
        }
        return false;
    };

    $scope.isEditBtnShowed = function() {
        return AnnotationDetails.isEditBtnShowed($scope.motivation);
    };

    $scope.menuEdit = function(evt) {
        AnnotationDetails.menuEdit(evt.toElement, $scope, 'left');
        // console.log("inside menu");
    };

    $scope.$watch(function() {
        return currentElement.height();
    }, function(newHeight, oldHeight) {
        if (typeof($scope.annotation) !== 'undefined') {
            if (newHeight !== oldHeight && $scope.annotation.expanded) {
                AnnotationSidebar.setAllPosition(currentId, newHeight);
            }
        }
    });

    // TODO find alternative to force digest and avoid watch delay on the height change (?)
    currentElement.bind('DOMSubtreeModified', function() {
        if (typeof($scope.annotation) !== 'undefined') {
            if (currentElement.height() !== currentHeight) {
                currentHeight = currentElement.height();
                if (currentHeight < 30 || currentHeight > 140) {
                    $rootScope.$$phase || $rootScope.$digest();
                }
            }
        }
    });

    AnnotationDetails.log('Controller Details Run');
});
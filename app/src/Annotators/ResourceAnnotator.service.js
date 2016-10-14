angular.module('Pundit2.Annotators')

.constant('RESOURCEANNOTATIONRDEFAULTS', {
    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#ResourceAnnotator
     *
     * @description
     * `object`
     *
     * Configuration object for ResourceAnnotator module.
     */

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#ResourceAnnotator.annotationButton
     *
     * @description
     * `boolean`
     *
     * activate annotation button
     * <pre> annotationButton: false </pre>
     */
    annotationButton: false,
    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#ResourceAnnotator.annotationButtonLabel
     *
     * @description
     * `string`
     *
     * label of annotation button
     * <pre> annotationButtonLabel: launch Pundit </pre>
     */
    annotationButtonLabel: "launch Pundit",
    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#ResourceAnnotator.annotationButtonLabelAfterClick
     *
     * @description
     * `string`
     *
     * label of annotation button
     * <pre> annotationButtonLabelAfterClick: Annotate </pre>
     */
    annotationButtonLabelAfterClick: "Annotate"

})

.service('ResourceAnnotator', function(BaseComponent, EventDispatcher, ItemsExchange, AnnotationsExchange, RESOURCEANNOTATIONRDEFAULTS) {
    var resourceAnnotator = new BaseComponent('ResourceAnnotator', RESOURCEANNOTATIONRDEFAULTS);
    var scopeMap = {};
    var uri = '';
    var UriDelete = '';

    resourceAnnotator.addReference = function(uri, currentResource) {
        scopeMap[uri] = currentResource;
    };

    resourceAnnotator.removeReference = function(uri) {
        if (typeof scopeMap[uri] !== 'undefined') {
            delete scopeMap[uri];
        }
    };

    EventDispatcher.addListeners(
        [
            'Consolidation.consolidate',
            'Pundit.forceCompileButton'
        ],
        function() {
            var item;

            for (var uri in scopeMap) {
                item = ItemsExchange.getItemByUri(uri);
                if (typeof item !== 'undefined') {
                    scopeMap[uri].setAnnotationNumber(uri);
                }
            }

        });
    EventDispatcher.addListeners(
        [
            'AnnotationsCommunication.deleteAnnotation',
            'AnnotationDetails.deleteAnnotation',
            'AnnotationsCommunication.saveAnnotation'
        ],
        function(e) {
            var ann = {};

            //if (e.args.length === 0) {
            //    return;
            //}
            ann = AnnotationsExchange.getAnnotationById(e.args);

            if (e.name === 'AnnotationsCommunication.saveAnnotation' &&
                typeof scopeMap[ann.entities[0]] !== 'undefined') {
                scopeMap[ann.entities[0]].increaseAnnotationNumber();
            }

            if (e.name === 'AnnotationsCommunication.deleteAnnotation' &&
                typeof scopeMap[uriDelete] !== 'undefined') {
                scopeMap[uriDelete].decreaseAnnotationNumber();
            }

            if (e.name === 'AnnotationDetails.deleteAnnotation') {
                ann = AnnotationsExchange.getAnnotationById(e.args);
                uriDelete = ann.entities[0];
            }
        });

    EventDispatcher.addListener('Pundit.wipeAll', function() {
        scopeMap = {};
    });

    return resourceAnnotator;
});
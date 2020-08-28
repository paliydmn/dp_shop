$(function(){
    if($('textarea#ta').length){
        CKEDITOR.replace('ta');
    }

    $('a.delete-confirm').on('click', () => {
        if (!confirm('Delete confirm'))
            return false;
    });

    if($("[data-fancybox]").length){
        $("[data-fancybox]").fancybox();
    }

});
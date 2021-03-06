jQuery(document).ready(function ($) {

    // Initialize ourselves
    var SideComments = require('side-comments');

    // We get this data from PHP
    var postComments = commentsData.comments;
    var userData = commentsData.user;

    var nonce = commentsData.nonce;
    var voting_nonce = commentsData.voting_nonce;
    var postID = commentsData.postID;
    var ajaxURL = commentsData.ajaxURL;
    var containerSelector = commentsData.containerSelector;
    var allowUserInteraction = commentsData.allowUserInteraction;

    var currentUser = null;

    if (userData) {
        // Format our data as side-comments.js requires
        currentUser = {
            id: userData.id,
            avatarUrl: userData.avatar,
            name: userData.name
        };
    }

    var formattedCommentData = [];
    var key;

    for (key in postComments) {

        if (arrayHasOwnIndex(postComments, key)) {

            var additionalObject = {
                'sectionId': key,
                'comments': postComments[key]
            };

            formattedCommentData.push(additionalObject);

        }

    }

    // Then, create a new SideComments instance, passing in the wrapper element and the optional the current user and any existing comments.
    sideComments = new SideComments(containerSelector, currentUser, formattedCommentData, allowUserInteraction);

    // http://stackoverflow.com/questions/9329446/how-to-do-for-each-over-an-array-in-javascript
    function arrayHasOwnIndex(array, prop) {
        return array.hasOwnProperty(prop) && /^0$|^[1-9]\d*$/.test(prop) && prop <= 4294967294; // 2^32 - 2
    }

    var newCommentID;

    // We need to listen for the post and delete events and post an AJAX response back to PHP
    sideComments.on('commentPosted', function (comment) {
        var section = $('#commentable-section-' + this.activeSection.id);
        var parentID = comment.parentID;
        var parent = null;
        if (parentID) {
            parent = $(section).find('.comment-form[data-comment=' + parentID + ']');
        } else {
            parent = $(section).find('.comments-wrapper > .comment-form');
        }

        var commentText = comment.comment.replace(/&nbsp;/g, ' ');

        if (commentText.trim().length > 0) {
            $.ajax({
                url: ajaxURL,
                dataType: 'json',
                type: 'POST',
                data: {
                    action: 'add_side_comment',
                    nonce: nonce,
                    postID: postID,
                    sectionID: comment.sectionId,
                    comment: comment.comment,
                    authorName: comment.authorName,
                    authorId: comment.authorId,
                    parentID: comment.parentID
                },
                success: function (response) {

                    if (response.success === false) {
                        var erro = $('.hidden > .alert-warning').clone();
                        erro.find('p').html(response.data.error_message);
                        erro.hide().insertBefore(parent).fadeIn(1000).delay(5000).slideUp(1000, function () {
                            $(this).remove();
                        });
                    } else {
                        newCommentID = response.data.newCommentID;
                        comment.id = response.data.newCommentID;
                        comment.commentID = comment.id;
                        comment.time = response.data.commentTime;

                        //setting default values for a new comment
                        comment.karma = 0;
                        comment.upvotes = 0;
                        comment.downvotes = 0;

                        // We'll need this if we want to delete the comment.
                        var newComment = sideComments.insertComment(comment);
                        var commentArea = $('#commentable-section-' + comment.sectionId + ' .comments-estructure');
                        var elementTop = commentArea.find('li.comment-main[data-comment-id=' + newCommentID + ']').offset().top;
                        var scrollPosition = elementTop - commentArea.offset().top + commentArea.scrollTop();
                        commentArea.animate({scrollTop: scrollPosition}, 1000);
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    var erro = $('.hidden > .alert-danger').clone();
                    erro.find('p').html("Falha ao adicionar o comentário. Tente novamente mais tarde");
                    erro.hide().insertBefore(parent).fadeIn(1000).delay(5000).slideUp(1000, function () {
                        $(this).remove();
                    });


                }
            });
        } else {
            var erro = $('.hidden > .alert-warning').clone();
            erro.find('p').html("Você não pode enviar um comentário vazio.");
            erro.hide().insertBefore(parent).fadeIn(1000).delay(5000).slideUp(1000, function () {
                $(this).remove();
            });

        }

    });

    // Listen to "commentDeleted" and send a request to your backend to delete the comment.
    // More about this event in the "docs" section.
    sideComments.on('commentDeleted', function (comment) {

        $.ajax({
            url: ajaxURL,
            dataType: 'json',
            type: 'POST',
            data: {
                action: 'delete_side_comment',
                nonce: nonce,
                postID: postID,
                commentID: comment.id
            },
            success: function (response) {

                if (response.type == 'success') {

                    comment.sectionId = comment.sectionId;

                    // OK, we can remove it from the stream
                    sideComments.removeComment(comment.sectionId, newCommentID);

                } else {

                    console.log('success, response.type not equal to success');
                    console.log(response);

                }

            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log('in error');
                console.log(jqXHR);
                console.log(textStatus);
                console.log(errorThrown);
            }
        });

        // $.ajax({
        // 	url: '/comments/' + commentId,
        // 	type: 'DELETE',
        // 	success: function( success ) {
        // 		// Do something.
        // 	}
        // });

    });

    //Removes .active from p.commentable-section when the cursor is click anywhere else but .commment-wrapper. Used to mimic same nature of side comments
    $('#content, html').on('click', function (e) {
        //console.log('clicked: #content, html');
        var clicked = $(e.target); // get the element clicked
        if (clicked.is('.comments-wrapper, .marker') ||
            clicked.parents().is('.comments-wrapper, .marker') ||
            clicked.hasClass('searchable-content') ||
            clicked.hasClass('commentable-section') ||
            clicked.parents('.commentable-section').length
        ) {
            return; // click happened within the dialog, do nothing here
        } else { // click was outside the dialog, so close it
            document.body.click();
            // Return to page scroll
            $('body').unbind('mousewheel');
        }
    });

    //When clicked browser scrolls to top of item
    $(".marker").on('click', function (e) {
        var target = $(e.target);
        var sectionSelected = target.parents(".commentable-section.active");
        var menuTopo = $('.menu-topo-mc');
        if (sectionSelected.offset()) {
            var scrollPos = sectionSelected.offset().top;
            if (menuTopo.hasClass('fixed-top-mc')) {
                scrollPos -= menuTopo.outerHeight(true);
            } else {
                scrollPos -= menuTopo.outerHeight(true) * 2;
            }
            $('body,html').animate({
                scrollTop: scrollPos
            }, 500);
        }
    });

    //Trigger close events when close btn is clicked or touched
    $(".comments-header div.close-btn").on('click touchstart', function (e) {
        e.preventDefault();
        document.body.click();
    });

    // Stops page from scrolling when mouse is hovering .comments-wrapper .comments
    if ($(window).width() > 767) {
        $('.comments-wrapper .comments-estructure').bind('mousewheel DOMMouseScroll', function (e) {
            var e0 = e.originalEvent,
                delta = e0.wheelDelta || -e0.detail;

            this.scrollTop += ( delta < 0 ? 1 : -1 ) * 10;
            e.preventDefault();
        });
    }

    //VOTING CONTROL
    var voteButtonClicked = false;

    // catch the upvote/downvote action
    $('div.commentable-container').on('click touchstart', 'a.vote-btn', function (e) {
        e.preventDefault();
        var parent = $(this).parents('.comment-weight-container');
        var value = 0;
        var comment_id = $(this).data('commentId');
        if ($(this).hasClass('vote-up')) {
            value = 'upvote';
        } else if ($(this).hasClass('vote-down')) {
            value = 'downvote';
        }

        if (false === voteButtonClicked) {
            voteButtonClicked = true;
            var post = $.post(
                ajaxURL, {
                    action: 'comment_vote_callback',
                    post_id: postID,
                    vote: value,
                    comment_id: comment_id,
                    vote_nonce: voting_nonce
                }
            );

            post.done(function (response) {
                if (response.success === false) {
                    var erro = $('.hidden > .alert-warning').clone();
                    erro.find('p').html(response.data.error_message);
                    erro.hide().appendTo(parent).fadeIn(1000).delay(5000).slideUp(1000, function () {
                        $(this).remove();
                    });
                } else {
                    $('#comment-weight-value-' + comment_id).text(response.data.weight);
                    $('#comment-' + value + '-value-' + comment_id).text(response.data.full_karma);

                    var sucesso = $('.hidden > .alert-success').clone();
                    sucesso.find('p').html(response.data.success_message);
                    sucesso.hide().appendTo(parent).fadeIn(1000).delay(5000).slideUp(1000, function () {
                        $(this).remove();
                    });
                }

                voteButtonClicked = false;
            });
        }
    });

    $('body').on('user_logged_in', function (e, user) {
        var userData = {
            id: user.ID,
            name: user.display_name
        };

        var post = $.post(
            ajaxURL, {
                action: 'refresh_nonce_callback'
            }
        );

        post.done(function (response) {
            if (response.success === false) {
                console.log(response.data.error_message);
            } else {
                nonce = response.data.nonce;
                voting_nonce = response.data.voting_nonce;
                sideComments.setCurrentUser(userData);
            }
        });

    });

    $('body').on('user_logged_out', function (e) {
        var post = $.post(
            ajaxURL, {
                action: 'refresh_nonce_callback'
            }
        );

        post.done(function (response) {
            if (response.success === false) {
                console.log(response.data.error_message);
            } else {
                nonce = response.data.nonce;
                voting_nonce = response.data.voting_nonce;
                sideComments.setCurrentUser(null);
            }
        });
    });
});

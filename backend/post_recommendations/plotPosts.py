# %%
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

LONG_POST_UPPER_LIMIT = 2000  ## Ideal upper length (characters) for longer posts
LONG_POST_LOWER_LIMIT = 1300  ## Ideal lower length (characters) for longer posts
SHORT_POST_UPPER_LIMIT = 300  ## Ideal upper length (characters) for shorter posts
SHORT_POST_LOWER_LIMIT = 150  ## Ideal lower length (characters) for shorter posts

allTags = {}
tagUses = sum(allTags.values())

plot_points = {}
x_vals = []
y_vals = []


def valueTransformation(x):
    """Transforms a non-negative integer to a value between 0 to 1.
    Uses the function y = -(1/(x + 1)) + 1."""

    if x < 0:
        return 0

    return (-1 * (1 / (float(x) + 1))) + 1


def calculateAverageCommentLength(comments):
    """Gets the average length of a collection of comments."""
    totalCharacterCount = 0

    for comment in comments:
        totalCharacterCount += len(comment["commentText"])

    return (
        0 if len(comments) == 0 else float(totalCharacterCount) / float(len(comments))
    )


def getDistance(point_one, point_two):
    # TODO

    return


def postToPoint(postInfo):
    """Converts post information to a plot point, (x, y).
    Factors in things like post engagement and post quality.
    Also used to replot posts when some interactions with post occur."""

    ## Calculating x-value for the post.
    ## Is calculated based on interactons with the post, such as the number of "comments" for the posts, the average length of these "comments", how many shares a post has, and information about the post's author.
    commentCount = len(postInfo["comments"])
    averageCommentLength = calculateAverageCommentLength(postInfo["comments"])

    commentInteractionScoring = (
        valueTransformation(commentCount) + valueTransformation(averageCommentLength)
    ) * 10

    x_val = (
        commentInteractionScoring
        + postInfo["resharesCount"]
        + (postInfo["upvoteCount"] / 2)
    )

    ## Calculating y-value for the post.
    ## Is calculated based on post content.
    postTextLength = len(postInfo["text"])
    strippedpostText = postInfo["text"].replace(" ", "")

    questionMarkCount = postInfo["text"].count("?")
    periodCount = postInfo["text"].count(".")
    exclamationPointCount = postInfo["text"].count("!")

    inquisitiveScore = 0
    informativeScore = 0
    creativityScore = 0

    if postTextLength > 0:
        inquisitiveScore = (
            valueTransformation(float(questionMarkCount) / float(len(strippedpostText)))
            * 100.00
        )
        informativeScore = (
            valueTransformation(float(periodCount) / float(len(strippedpostText)))
            * 100.00
        )
        creativityScore = (
            valueTransformation(
                ((float(questionMarkCount) + float(periodCount)) / 2)
                / float(len(strippedpostText))
            )
            * 100.00
        )

    postLengthScoring = 0
    long_post = False

    ## Post recieves full points if within the ideal for short or long posts.
    if (
        postTextLength > LONG_POST_LOWER_LIMIT
        and postTextLength < LONG_POST_UPPER_LIMIT
    ):
        long_post = True
        postLengthScoring = 10
    elif (
        postTextLength > SHORT_POST_LOWER_LIMIT
        and postTextLength < SHORT_POST_UPPER_LIMIT
    ):
        postLengthScoring = 10
    else:
        shortLowerLimitScoring = 10.0 - (
            (abs(SHORT_POST_LOWER_LIMIT - postTextLength) / SHORT_POST_LOWER_LIMIT)
            * 10.0
        )
        shortUpperLimitScoring = 10.0 - (
            (abs(SHORT_POST_UPPER_LIMIT - postTextLength) / SHORT_POST_UPPER_LIMIT)
            * 10.0
        )
        longLowerLimitScoring = 10.0 - (
            (abs(LONG_POST_LOWER_LIMIT - postTextLength) / LONG_POST_LOWER_LIMIT) * 10.0
        )
        longUpperLimitScoring = 10.0 - (
            (abs(LONG_POST_UPPER_LIMIT - postTextLength) / LONG_POST_UPPER_LIMIT) * 10.0
        )

        if longLowerLimitScoring > shortUpperLimitScoring:
            ## Classifies as a long post if closer to the long posts character length.
            long_post = True

        postLengthScoring = max(
            shortLowerLimitScoring,
            shortUpperLimitScoring,
            longLowerLimitScoring,
            longUpperLimitScoring,
        )

    tag_scoring = 0

    for tag in postInfo["tags"]:
        tag_scoring += (allTags[tag] / tagUses) * 10

    y_val = (
        tag_scoring
        + postLengthScoring
        + inquisitiveScore
        + informativeScore
        + creativityScore
    )

    x_vals.append(x_val)
    y_vals.append(y_val)

    plot_points[postInfo["id"]] = [x_val, y_val]

    return (x_val, y_val)


def plotRecommendations(posts):
    """Plots all posts on a single graph.
    Post are recieved as an array of dictionaries.
    Called upon starting the server.
    """
    for post in posts:
        postPlot = postToPoint(post)

    df = pd.DataFrame(x_vals, y_vals)
    plt.scatter(x_vals, y_vals)
    plt.xlim(0)
    plt.ylim(0)
    plt.show()

    return

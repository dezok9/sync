# %%
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

LONG_POST_UPPER_LIMIT = 2000
LONG_POST_LOWER_LIMIT = 1300
SHORT_POST_LOWER_LIMIT = 150
SHORT_POST_LOWER_LIMIT = 300

plot_points = {}
x_vals = [0, 6, 0]
y_vals = [0, 3, 2]


def functionTransformation(x, y):
    return


def wordIntentValueTransformation(x):
    """Transforms a value between 0 and 100 to a value between 0 to 1.
    Produces a value used to assess the intent of a word.
    Uses the function y = -(1/(x + 1)) + 1."""

    return (-1 * (1 / (float(x) + 1))) + 1


def getDistance(point_one, point_two):

    return


def postToPoint(postInfo):
    """Converts post information to a plot point, (x, y).
    Factors in things like post engagement and post quality.
    Also used to replot posts when some interactions with post occur."""

    ## Calculating x-value for the post.
    ## Is calculated based on interactons with the post, such as the number of "comments" for the posts, the average length of these "comments", how many shares a post has, and information about the post's author.
    x_val = 0

    ## Calculating y-value for the post.
    ## Is calculated based on post content
    y_val = 0

    ## Ratings ranging from 0 to 1.
    postTextLength = len(post["text"])
    strippedpostText = post["text"].replace(" ", "")
    
    questionMarkCount = post["text"].count("?")
    periodCount = post["text"].count(".")
    exclamationPointCount = post["text"].count("!")

    inquisitiveRating = 0
    informativeRating = 0
    creativityRating = 0 

    if postTextLength > 0:
        inquisitiveRating = wordIntentValueTransformation(float(questionMarkCount)/float(len(strippedpostText))) * 100.00
        informativeRating = wordIntentValueTransformation(float(periodCount)/float(len(strippedpostText))) * 100.00
        creativityRating = wordIntentValueTransformation(((float(questionMarkCount) + float(periodCount))/2)/float(len(strippedpostText))) * 100.00

    x_vals.append(x_val)
    y_vals.append(y_val)

    plot_points[post["id"]] = [x_val, y_val]

    return (x_val, y_val)


def plotRecommendations(posts):
    """Plots all posts on a single graph.
    Post are recieved as an array of dictionaries.
    Called upon starting the server.
    """
    for post in posts:
        postPlot = postToPoint(post)

    return


def getPostRecommendations(userData):
    """
    Gets the similar recommendations of posts, where similarity is defined as being close on a graph.
    """
    ## TODO
    return

for post in samplePosts:
    postToPoint(post)

plotRecommendations({"14": {}})

df = pd.DataFrame(x_vals, y_vals)
plt.scatter(x_vals, y_vals)
plt.show()

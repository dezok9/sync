## The upper limit of how many similar posts should be retrieved.
import sys
import math
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

MAX_SIMILAR_POSTS_POOL = 60
MAX_SIMILAR_POSTS_PERCENT = 0.20  ## The percentage of all posts of should be retrieved.
SIMILARITY_POINTS_RANGE = (
    20.0  ## The origial range of points used to get similar points.
)

## Convert strings to Python.
userData = eval(sys.argv[1])
postPoints = eval(
    sys.argv[2]
)  ## Dictionary of graphical represenation of posts, where the key is the id of a post and the value is a list of size two representing the posts x and y values.
numberOfRecs = eval(sys.argv[3])


def getDistance(point_one, point_two):
    """Gets the Euclidian distance between two points."""
    return math.sqrt(
        (math.pow(point_one[0] - point_two[0], 2))
        + (math.pow(point_one[1] - point_two[1], 2))
    )


def userInteractionsToPoint():
    """Uses recent user post interactions to produce a point on the graph, (x, y)"""
    sum_of_x_values = 0
    sum_of_y_values = 0
    for recentUpvotedPostsID in userData["recentUpvotedPostsIDs"]:
        sum_of_x_values += postPoints[str(recentUpvotedPostsID)][0]
        sum_of_y_values += postPoints[str(recentUpvotedPostsID)][1]

    x_val = float(sum_of_x_values) / float(len(userData["recentUpvotedPostsIDs"]))
    y_val = float(sum_of_y_values) / float(len(userData["recentUpvotedPostsIDs"]))

    return [x_val, y_val]


def getSimilarPosts(userData, postPoints, numberOfRecs):
    """
    Gets the similar recommendations of posts, where similarity is defined as being close on a graph.
    First, gets all posts that are close to the user's plot before determining if the user as already interacted with that post.
    Returns the IDs of posts that are a short distance away from the user's plot. This will then be used to determine relevant posts.
    """
    similarPostIDs = []
    currentSearchRange = SIMILARITY_POINTS_RANGE
    similarPostsPool = (
        (len(postPoints) * MAX_SIMILAR_POSTS_PERCENT)
        if (len(postPoints) * MAX_SIMILAR_POSTS_PERCENT) < MAX_SIMILAR_POSTS_POOL
        else MAX_SIMILAR_POSTS_POOL
    )  ## Upper limit of how many posts to get for initial comparison.

    userPoint = userInteractionsToPoint()

    ## Gets a pool of similar posts (those that are close to the plot of the user's interaction)
    ## Retrieves 20% of posts on the platform OR fifty, whichever is smaller. Done to cap the number of posts being looked over.
    while len(similarPostIDs) < similarPostsPool:
        max_distance = getDistance(
            userPoint,
            [userPoint[0] + currentSearchRange, userPoint[1] + currentSearchRange],
        )

        for postID in postPoints.keys():
            if postID in userData["recentUpvotedPostsIDs"] or postID in similarPostIDs:
                ## If the user has already interacted with this post OR it has already been flagged as a similar post
                continue
            elif (
                getDistance(userPoint, postPoints[postID]) < max_distance
                and len(similarPostIDs) < similarPostsPool
            ):
                similarPostIDs.append(int(postID))
            elif len(similarPostIDs) >= similarPostsPool:
                break

        currentSearchRange += SIMILARITY_POINTS_RANGE

    ## Printing to send the output back to the JS server.
    print(similarPostIDs)

    return similarPostIDs


getSimilarPosts(userData, postPoints, numberOfRecs)

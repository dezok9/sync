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
user_data = eval(sys.argv[1])
post_points = eval(
    sys.argv[2]
)  ## Dictionary of graphical represenation of posts, where the key is the id of a post and the value is a list of size two representing the posts x and y values.
number_of_recs = eval(sys.argv[3])


def get_distance(point_one, point_two):
    """Gets the Euclidian distance between two points."""
    return math.sqrt(
        (math.pow(point_one[0] - point_two[0], 2))
        + (math.pow(point_one[1] - point_two[1], 2))
    )


def user_interactions_to_point():
    """Uses recent user post interactions to produce a point on the graph, (x, y)"""
    sum_of_x_values = 0
    sum_of_y_values = 0

    x_val = -1.0
    y_val = -1.0

    if len(user_data["recentUpvotedPostsIDs"]) > 0:
        # Calculates value from past post upvotes.
        for recent_upvoted_posts_id in user_data["recentUpvotedPostsIDs"]:
            sum_of_x_values += post_points[str(recent_upvoted_posts_id)][0]
            sum_of_y_values += post_points[str(recent_upvoted_posts_id)][1]

        x_val = float(sum_of_x_values) / float(len(user_data["recentUpvotedPostsIDs"]))
        y_val = float(sum_of_y_values) / float(len(user_data["recentUpvotedPostsIDs"]))
    elif len(list(post_points.values())) > 0:
        # Gives a default plot point.
        x_sum = 0.0
        y_sum = 0.0

        for point in list(post_points.values()):
            x_sum += point[0]
            y_sum += point[1]

        x_val = x_sum / float(len(list(post_points.values())))
        y_val = y_sum / float(len(list(post_points.values())))
    else:
        x_val = 0
        y_val = 0

    x_values = []
    y_values = []

    for plot_point in list(post_points.values()):
        x_values.append(plot_point[0])
        y_values.append(plot_point[1])

    return [x_val, y_val]


def get_similar_posts(user_data, post_points, number_of_recs):
    """
    Gets the similar recommendations of posts, where similarity is defined as being close on a graph.
    First, gets all posts that are close to the user's plot before determining if the user as already interacted with that post.
    Returns the IDs of posts that are a short distance away from the user's plot. This will then be used to determine relevant posts.
    """
    similar_post_ids = []
    current_search_range = SIMILARITY_POINTS_RANGE
    similar_posts_pool = (
        (len(post_points) * MAX_SIMILAR_POSTS_PERCENT)
        if (len(post_points) * MAX_SIMILAR_POSTS_PERCENT) < MAX_SIMILAR_POSTS_POOL
        else MAX_SIMILAR_POSTS_POOL
    )  ## Upper limit of how many posts to get for initial comparison.

    user_point = user_interactions_to_point()

    ## Gets a pool of similar posts (those that are close to the plot of the user's interaction)
    ## Retrieves 20% of posts on the platform OR fifty, whichever is smaller. Done to cap the number of posts being looked over.
    while len(similar_post_ids) < similar_posts_pool:
        max_distance = get_distance(
            user_point,
            [
                user_point[0] + current_search_range,
                user_point[1] + current_search_range,
            ],
        )

        for post_id in post_points.keys():
            if (
                post_id in user_data["recentUpvotedPostsIDs"]
                or post_id in similar_post_ids
            ):
                ## If the user has already interacted with this post OR it has already been flagged as a similar post
                continue
            elif (
                get_distance(user_point, post_points[post_id]) < max_distance
                and len(similar_post_ids) < similar_posts_pool
            ):
                similar_post_ids.append(int(post_id))
            elif len(similar_post_ids) >= similar_posts_pool:
                break

        current_search_range += SIMILARITY_POINTS_RANGE

    ## Printing to send the output back to the JS server.
    print(similar_post_ids)

    return similar_post_ids


get_similar_posts(user_data, post_points, number_of_recs)

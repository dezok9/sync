import sys
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

LONG_POST_UPPER_LIMIT = 2000  ## Ideal upper length (characters) for longer posts
LONG_POST_LOWER_LIMIT = 1300  ## Ideal lower length (characters) for longer posts
SHORT_POST_UPPER_LIMIT = 300  ## Ideal upper length (characters) for shorter posts
SHORT_POST_LOWER_LIMIT = 150  ## Ideal lower length (characters) for shorter posts

plot_points = {}
x_vals = []
y_vals = []

## Convert string of post information to Python list.
post_info = eval(sys.argv[1])
all_tags = eval(sys.argv[2])

tag_uses = sum(all_tags.values())


def value_transformation(x):
    """Transforms a non-negative integer to a value between 0 to 1.
    Uses the function y = -(1/(x + 1)) + 1."""

    if x < 0:
        return 0

    return (-1 * (1 / (float(x) + 1))) + 1


def calculate_average_comment_length(comments):
    """Gets the average length of a collection of comments."""
    total_character_count = 0

    for comment in comments:
        total_character_count += len(comment["commentText"])

    return (
        0 if len(comments) == 0 else float(total_character_count) / float(len(comments))
    )


def post_to_point(post_info):
    """Converts post information to a plot point, (x, y).
    Factors in characterists of a post, such as post engagement and post quality.
    Also used to replot posts when some interactions with post occur."""

    ## Calculating x-value for the post.
    ## Is calculated based on interactons with the post, such as the number of "comments" for the posts, the average length of these "comments", how many shares a post has, and information about the post's author.
    comment_count = len(post_info["comments"])
    average_comment_length = calculate_average_comment_length(post_info["comments"])

    comment_interaction_scoring = (
        value_transformation(comment_count)
        + value_transformation(average_comment_length)
    ) * 10

    x_val = (
        comment_interaction_scoring
        + post_info["resharesCount"]
        + (post_info["upvoteCount"] / 2)
    )

    ## Calculating y-value for the post.
    ## Is calculated based on post content.
    post_text_length = len(post_info["text"])
    stripped_post_text = post_info["text"].replace(" ", "")

    question_mark_count = post_info["text"].count("?")
    period_count = post_info["text"].count(".")
    exclamation_point_count = post_info["text"].count("!")

    inquisitive_score = 0
    informative_score = 0
    creativity_score = 0

    if post_text_length > 0:
        inquisitive_score = (
            value_transformation(
                float(question_mark_count) / float(len(stripped_post_text))
            )
            * 100.00
        )
        informative_score = (
            value_transformation(float(period_count) / float(len(stripped_post_text)))
            * 100.00
        )
        creativity_score = (
            value_transformation(
                ((float(question_mark_count) + float(period_count)) / 2)
                / float(len(stripped_post_text))
            )
            * 100.00
        )

    post_length_scoring = 0
    long_post = False

    ## Post recieves full points if within range of the ideal character length for short or long posts.
    if (
        post_text_length > LONG_POST_LOWER_LIMIT
        and post_text_length < LONG_POST_UPPER_LIMIT
    ):
        long_post = True
        post_length_scoring = 10
    elif (
        post_text_length > SHORT_POST_LOWER_LIMIT
        and post_text_length < SHORT_POST_UPPER_LIMIT
    ):
        post_length_scoring = 10
    else:
        short_lower_limit_scoring = 10.0 - (
            (abs(SHORT_POST_LOWER_LIMIT - post_text_length) / SHORT_POST_LOWER_LIMIT)
            * 10.0
        )
        short_upper_limit_scoring = 10.0 - (
            (abs(SHORT_POST_UPPER_LIMIT - post_text_length) / SHORT_POST_UPPER_LIMIT)
            * 10.0
        )
        long_lower_limit_scoring = 10.0 - (
            (abs(LONG_POST_LOWER_LIMIT - post_text_length) / LONG_POST_LOWER_LIMIT)
            * 10.0
        )
        long_upper_limit_scoring = 10.0 - (
            (abs(LONG_POST_UPPER_LIMIT - post_text_length) / LONG_POST_UPPER_LIMIT)
            * 10.0
        )

        if long_lower_limit_scoring > short_upper_limit_scoring:
            ## Classifies as a long post if closer to the long posts character length.
            long_post = True

        post_length_scoring = max(
            short_lower_limit_scoring,
            short_upper_limit_scoring,
            long_lower_limit_scoring,
            long_upper_limit_scoring,
        )

    tag_scoring = 0

    for tag in post_info["tags"]:
        tag_scoring += (all_tags[tag] / tag_uses) * 10

    y_val = (
        tag_scoring
        + post_length_scoring
        + inquisitive_score
        + informative_score
        + creativity_score
    )

    x_vals.append(x_val)
    y_vals.append(y_val)

    post_id = str(post_info["id"])
    plot_points[post_id] = [x_val, y_val]

    return [x_val, y_val]


def plot_recommendations(posts):
    """Plots all posts on a single graph.
    Post are recieved as an array of dictionaries.
    Called upon starting the server.
    """

    for post in posts:
        post_plot = post_to_point(post)

    ## Printing to send the output back to the JS server.
    print(plot_points)


plot_recommendations(post_info)

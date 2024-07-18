SIMILARITY_POINTS_RANGE = 20  ## The origial range of points used to get similar points.
MAX_SIMILAR_POSTS_POOL = (
    50  ## The upper limit of how many similar posts should be retrieved
)
MAX_SIMILAR_POSTS_PERCENT = 0.20  ## The percentage of all posts of should be retrieved


def userInteractionsToPoint(userData):
    """Uses recent user post interactions to produce a point on the graph, (x, y)"""
    x_val = 0

    sumOfXValues = 0
    for userPostInteraction in userPostInteractions:
        sumOfXValues += userPostInteraction[id]

    # TODO

    y_val = 0

    # TODO

    return [0, 0]


def getPostRecommendations(userData, postPlots):
    """
    Gets the similar recommendations of posts, where similarity is defined as being close on a graph.
    First, gets all posts that are close to the user's plot
    """
    ## TODO

    similarPostIDs = []
    currentSearchRange = SIMILARITY_POINTS_RANGE
    similarPostsPool = (
        (len(postPlots) * MAX_SIMILAR_POSTS_PERCENT)
        if (len(postPlots) * MAX_SIMILAR_POSTS_PERCENT) < MAX_SIMILAR_POSTS_POOL
        else MAX_SIMILAR_POSTS_POOL
    )  ## Upper limit of how many posts to get for original comparison;

    userPoint = userInteractionsToPoint(userData)

    while len(similarPostIDs) < similarPostsPool:
        for post in postPlots:
            if (
                (
                    postPlots[post][0] < userPoint[0] - currentSearchRange
                    and postPlots[post][0] > userPoint[0] + currentSearchRange
                )
                and (
                    postPlots[post][1] < userPoint[1] - currentSearchRange
                    and postPlots[post][1] > userPoint[1] + currentSearchRange
                )
                and len(similarPostIDs) < similarPostsPool
            ):
                similarPostIDs.append(int(post))
            elif len(similarPostIDs) < similarPostsPool:
                break

            currentSearchRange += SIMILARITY_POINTS_RANGE

    # TODO

    return []

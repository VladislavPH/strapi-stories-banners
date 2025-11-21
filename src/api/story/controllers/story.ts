/**
 * story controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::story.story', ({ strapi }) => ({
  async find(ctx) {
    const query = ctx.query ?? {}
    const { phoneNumber, ...restQuery } = query

    ctx.query = restQuery
    const response = await super.find(ctx)
    const stories = response.data || []

    if (!stories.length) {
      return response
    }

    if (!phoneNumber) {
      response.data = stories.map((story) => ({
        ...story,
        attributes: {
          ...story.attributes,
          isViewed: false,
        },
      }))
      return response
    }

    const storyIds = stories
      .map((story) => story?.id)
      .filter((id): id is string | number => typeof id === 'string' || typeof id === 'number')
      .map((id) => String(id))

    const storyDocumentIds = stories
      .map((story) => (story as any)?.documentId ?? story?.attributes?.documentId)
      .filter((id): id is string | number => typeof id === 'string' || typeof id === 'number')
      .map((id) => String(id))

    const storyFilters: Record<string, unknown>[] = []

    if (storyIds.length) {
      storyFilters.push({
        story: {
          id: {
            $in: storyIds,
          },
        },
      })
    }

    if (storyDocumentIds.length) {
      storyFilters.push({
        story: {
          documentId: {
            $in: storyDocumentIds,
          },
        },
      })

      storyFilters.push({
        documentId: {
          $in: storyDocumentIds,
        },
      })
    }
    const storyViews = (await strapi.entityService.findMany(
      'api::storyview.storyview' as any,
      {
        fields: ['id', 'documentId'],
        filters: {
          phoneNumber,
          ...(storyFilters.length ? { $or: storyFilters } : {}),
        },
        populate: {
          story: {
            fields: ['id', 'documentId'],
          },
        },
        limit: Math.max(storyIds.length, storyDocumentIds.length) || undefined,
      }
    )) as Array<{
      documentId?: string | number | null
      story?: { id?: string | number | null; documentId?: string | number | null } | null
    }>

    const viewedStoryIds = new Set(
      storyViews
        .map((view) => view?.story?.id)
        .filter((id): id is string | number => typeof id === 'number' || typeof id === 'string')
        .map((id) => String(id))
    )

    const viewedStoryDocumentIds = new Set(
      storyViews
        .map((view) => view?.story?.documentId ?? view?.documentId)
        .filter((id): id is string | number => typeof id === 'number' || typeof id === 'string')
        .map((id) => String(id))
    )

    response.data = stories.map((story) => ({
      ...story,
      attributes: {
        ...story.attributes,
        isViewed:
          viewedStoryIds.has(String(story.id)) ||
          viewedStoryDocumentIds.has(
            String((story as any)?.documentId ?? story?.attributes?.documentId)
          ),
      },
    }))

    return response
  },
}))

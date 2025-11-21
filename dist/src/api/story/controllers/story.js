"use strict";
/**
 * story controller
 */
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
exports.default = strapi_1.factories.createCoreController('api::story.story', ({ strapi }) => ({
    async find(ctx) {
        var _a;
        const query = (_a = ctx.query) !== null && _a !== void 0 ? _a : {};
        const { phoneNumber, ...restQuery } = query;
        ctx.query = restQuery;
        const response = await super.find(ctx);
        const stories = response.data || [];
        if (!stories.length) {
            return response;
        }
        if (!phoneNumber) {
            response.data = stories.map((story) => ({
                ...story,
                attributes: {
                    ...story.attributes,
                    isViewed: false,
                },
            }));
            return response;
        }
        const storyIds = stories.map((story) => story.id);
        const storyViews = (await strapi.entityService.findMany('api::story-view.story-view', {
            fields: ['id'],
            filters: {
                phoneNumber,
                story: {
                    id: {
                        $in: storyIds,
                    },
                },
            },
            populate: {
                story: {
                    fields: ['id'],
                },
            },
            limit: storyIds.length,
        }));
        const viewedStoryIds = new Set(storyViews
            .map((view) => { var _a; return (_a = view === null || view === void 0 ? void 0 : view.story) === null || _a === void 0 ? void 0 : _a.id; })
            .filter((id) => typeof id === 'number' || typeof id === 'string')
            .map((id) => String(id)));
        response.data = stories.map((story) => ({
            ...story,
            attributes: {
                ...story.attributes,
                isViewed: viewedStoryIds.has(String(story.id)),
            },
        }));
        return response;
    },
}));

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BookmarkState } from '../../types/bookmarks';
import { NewsArticle } from '../../types/news';

const initialState: BookmarkState = {
  bookmarks: [],
};

const bookmarkSlice = createSlice({
  name: 'bookmarks',
  initialState,
  reducers: {
    hydrateBookmarks: (state, action: PayloadAction<NewsArticle[]>) => {
      state.bookmarks = action.payload;
    },
    addBookmark: (state, action: PayloadAction<NewsArticle>) => {
      if (!state.bookmarks.find((b) => b.url === action.payload.url)) {
        state.bookmarks.push(action.payload);
      }
    },
    removeBookmark: (state, action: PayloadAction<string>) => {
      state.bookmarks = state.bookmarks.filter((b) => b.url !== action.payload);
    },
    clearBookmarks: (state) => {
      state.bookmarks = [];
    },
  },
});

export const { hydrateBookmarks, addBookmark, removeBookmark, clearBookmarks } =
  bookmarkSlice.actions;
export default bookmarkSlice.reducer;

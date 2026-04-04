import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { NewsArticle, NewsFilters, NewsState } from '../../types/news';

const initialState: NewsState = {
  articles: [],
  loading: false,
  error: null,
  filters: {
    q: '',
    category: '',
    from: '',
    to: '',
    language: 'en',
  },
};

export const fetchNews = createAsyncThunk<
  NewsArticle[],
  NewsFilters,
  { rejectValue: string }
>('news/fetchNews', async (filters, { rejectWithValue }) => {
  try {
    const normalizedFilters: NewsFilters = {
      ...filters,
      q: filters.q?.trim(),
    };
    const queryParams = new URLSearchParams();

    Object.entries(normalizedFilters).forEach(([key, value]) => {
      if (typeof value === 'string' && value.trim().length > 0) {
        queryParams.append(key, value);
      }
    });

    const response = await fetch(`/api/news?${queryParams.toString()}`);
    const data = (await response.json()) as {
      articles?: NewsArticle[];
      error?: string;
    };

    if (!response.ok) {
      return rejectWithValue(data.error ?? 'Failed to fetch news');
    }

    return data.articles ?? [];
  } catch {
    return rejectWithValue('Failed to fetch news. Please try again.');
  }
});

const deduplicateArticles = (articles: NewsArticle[]): NewsArticle[] => {
  const seen = new Set<string>();

  return articles.filter((article) => {
    const key = `${article.title}-${article.source.name}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const newsSlice = createSlice({
  name: 'news',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<NewsFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearNewsError: (state) => {
      state.error = null;
    },
    clearArticles: (state) => {
      state.articles = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNews.fulfilled, (state, action) => {
        state.loading = false;
        state.articles = deduplicateArticles(action.payload);
      })
      .addCase(fetchNews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to fetch news';
      });
  },
});

export const { setFilters, clearNewsError, clearArticles } = newsSlice.actions;
export default newsSlice.reducer;

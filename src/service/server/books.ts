// Books API — matches Taro src/service/hbut/book.js
import { serverGet, serverPost, serverPut, serverDelete, serverUpload } from "@/utils/serverRequest";
import { withCache } from "@/service/utils";
import userManager from "@/service/userInfo";

export interface BookItem {
  id: number;
  name: string;
  price: number;
  publisher: string;
  category: string;
  author?: string;
  isbn?: string;
  condition?: string;
  contact?: string;
  description?: string;
  images?: Array<{ url: string }>;
  wantCount?: number;
  isDelivery?: number;
  isPublisher?: boolean;
  publishTime?: string;
  publisherName?: string;
  book_type?: number;
  status?: number;
}

function normalizeBook(b: Record<string, unknown>): BookItem {
  // images: server may return `images` array or `image_url` string
  let images: Array<{ url: string }> = [];
  if (Array.isArray(b.images) && b.images.length > 0) {
    images = b.images as Array<{ url: string }>;
  } else if (typeof b.image_url === "string" && b.image_url) {
    images = [{ url: b.image_url }];
  }

  const currentUserId = userManager.getServerUserId();
  const isPublisher = !!(currentUserId && String(b.user_id) === String(currentUserId));

  return {
    id: (b.id ?? b.book_id ?? 0) as number,
    name: (b.name ?? b.title ?? "") as string,
    price: (b.price ?? 0) as number,
    publisher: (b.publisher ?? "") as string,
    category: (b.category ?? "") as string,
    author: (b.author ?? "") as string,
    isbn: (b.isbn ?? "") as string,
    condition: (b.condition ?? "") as string,
    contact: (b.contact ?? "") as string,
    description: (b.description ?? "") as string,
    images,
    wantCount: (b.wantCount ?? b.want_count ?? 0) as number,
    isDelivery: (b.isDelivery ?? b.is_delivery ?? 0) as number,
    publishTime: (b.publishTime ?? b.create_time ?? "") as string,
    publisherName: (b.publisherName ?? b.nickName ?? "") as string,
    book_type: (b.book_type ?? 1) as number,
    status: (b.status ?? null) as number | undefined,
    isPublisher,
  };
}

export const getBookList = withCache(
  async (_forceRefresh = false): Promise<{ books: BookItem[]; total: number }> => {
    const res = await serverGet<Array<Record<string, unknown>>>("/api/v1/books", { page: "1", pageSize: "200" });
    const books = (res.data ?? []).map(normalizeBook);
    return { books, total: books.length };
  },
  { cacheKey: "v1_books", ttl: 5 * 60 * 1000, resultValidator: (r) => !!r.books },
);

export const getBookCategories = withCache(
  async (_forceRefresh = false): Promise<string[]> => {
    const res = await serverGet<string[]>("/api/v1/books/categories");
    const cats = (res.data ?? []).filter((c) => c !== "全部");
    return ["全部", ...cats];
  },
  { cacheKey: "v1_book_categories", ttl: 5 * 60 * 1000, resultValidator: (r) => r.length > 0 },
);

export async function getBookDetail(id: number): Promise<BookItem> {
  const res = await serverGet<Record<string, unknown>>(
    `/api/v1/books/${id}`,
    getAuthParams() as Record<string, string>,
  );
  if (res.data) return normalizeBook(res.data);
  throw new Error("书籍不存在");
}

function getAuthParams(): Record<string, unknown> {
  return {
    school_id: userManager.getSchoolId(),
    stu_id: userManager.stuId,
    password: userManager.getEncryptedPassword(),
  };
}

export async function createBook(data: Record<string, unknown>): Promise<{ success: boolean; id?: number; message?: string }> {
  const res = await serverPost<{ success: boolean; id?: number; message?: string }>("/api/v1/books", { ...data, ...getAuthParams() });
  if (res.success) void getBookList.invalidate();
  return res;
}

export async function updateBook(id: number, data: Record<string, unknown>): Promise<{ success: boolean; message?: string }> {
  const res = await serverPut<{ success: boolean; message?: string }>(`/api/v1/books/${id}`, { ...data, ...getAuthParams() });
  if (res.success) void getBookList.invalidate();
  return res;
}

export async function toggleWantBook(id: number): Promise<{ want_count: number; wanted: boolean }> {
  const res = await serverPost<{ want_count: number; wanted: boolean }>(
    `/api/v1/books/${id}/want`,
    getAuthParams(),
  );
  if (!res.data) throw new Error("操作失败");
  return res.data;
}

export async function deleteBook(id: number): Promise<{ success: boolean; message?: string }> {
  const res = await serverDelete(
    `/api/v1/books/${id}`,
    getAuthParams() as Record<string, string>,
  );
  const ok = res.success;
  if (ok) void getBookList.invalidate();
  return { success: ok, message: res.message };
}

export async function uploadBookImage(
  fileUri: string,
): Promise<{ url: string }> {
  const res = await serverUpload("/api/v1/books/upload", fileUri);
  if (!res.data?.url) throw new Error(res.message ?? "上传失败");
  // Resolve relative path to full URL
  const url = res.data.url.startsWith("http")
    ? res.data.url
    : `https://spinach.cc.cd${res.data.url}`;
  return { url };
}

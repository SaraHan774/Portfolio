# Required Firestore Composite Indexes

This document lists the Firestore composite indexes required for the front package Data Layer.

## Works Collection

### Index 1: Published Works by Keyword
**Purpose**: Query published works filtered by sentence category (keyword)

```
Collection: works
Fields:
  - isPublished (Ascending)
  - sentenceCategoryIds (Array-contains)
```

**Used in**: `worksApi.ts` → `fetchWorksByKeywordId()`

### Index 2: Published Works by Exhibition Category
**Purpose**: Query published works filtered by exhibition category

```
Collection: works
Fields:
  - isPublished (Ascending)
  - exhibitionCategoryIds (Array-contains)
```

**Used in**: `worksApi.ts` → `fetchWorksByExhibitionCategoryId()`

### Index 3: Published Works by Published Date
**Purpose**: Query published works ordered by publication date (already exists if using basic queries)

```
Collection: works
Fields:
  - isPublished (Ascending)
  - publishedAt (Descending)
```

**Used in**: `worksApi.ts` → `fetchPublishedWorks()`

## Categories Collections

### Sentence Categories

```
Collection: sentenceCategories
Fields:
  - isActive (Ascending)
  - displayOrder (Ascending)
```

**Used in**: `categoriesApi.ts` → `fetchSentenceCategories()`

### Exhibition Categories

```
Collection: exhibitionCategories
Fields:
  - isActive (Ascending)
  - displayOrder (Ascending)
```

**Used in**: `categoriesApi.ts` → `fetchExhibitionCategories()`

## Creating Indexes

### Option 1: Using Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Indexes**
4. Click **Create Index** and add the fields listed above

### Option 2: Using `firestore.indexes.json`
Update your `firestore.indexes.json` file:

```json
{
  "indexes": [
    {
      "collectionGroup": "works",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isPublished", "order": "ASCENDING" },
        { "fieldPath": "sentenceCategoryIds", "arrayConfig": "CONTAINS" }
      ]
    },
    {
      "collectionGroup": "works",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isPublished", "order": "ASCENDING" },
        { "fieldPath": "exhibitionCategoryIds", "arrayConfig": "CONTAINS" }
      ]
    },
    {
      "collectionGroup": "works",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isPublished", "order": "ASCENDING" },
        { "fieldPath": "publishedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "sentenceCategories",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "displayOrder", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "exhibitionCategories",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "displayOrder", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Then deploy using:
```bash
firebase deploy --only firestore:indexes
```

## Error Handling

If you encounter a `failed-precondition` error, it means a required composite index is missing. The error message will include a link to auto-create the index in Firebase Console.

**Example error**:
```
FirebaseError: The query requires an index.
You can create it here: https://console.firebase.google.com/...
```

Click the provided link to automatically create the required index.

## Notes

- Composite indexes can take several minutes to build
- Indexes are not required for local development with Firestore Emulator
- Index creation is automatic when you first run a query in production (if you click the provided link)
- Regularly review and clean up unused indexes to reduce costs

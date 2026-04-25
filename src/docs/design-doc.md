# 🏁 Project Goal

The goal of this project is to create a Progressive Web App (PWA) optimized for iPhone that interacts with the API described in `api-v2.md`. The app will allow users to:

- View transactions grouped by statement period (not as a full list)
- Add, edit, and remove projected transactions for each statement period
- Only display transactions relevant to the selected statement period, ensuring focused and organized financial management

All backend integration must follow the API contract in `api-v2.md`.

# 🧱 Components And Styling

## Components Best Practices

#### Colocate things as close as possible to where it's being used

Keep components, functions, styles, state, etc. as close as possible to where they are being used. This will not only make your codebase more readable and easier to understand but it will also improve your application performance since it will reduce redundant re-renders on state updates.

#### Avoid large components with nested rendering functions

Do not add multiple rendering functions inside your application, this gets out of control pretty quickly. What you should do instead is if there is a piece of UI that can be considered as a unit, is to extract it in a separate component.

```javascript
// this is very difficult to maintain as soon as the component starts growing
function Component() {
  function renderItems() {
    return <ul>...</ul>;
  }
  return <div>{renderItems()}</div>;
}

// extract it in a separate component
function Items() {
  return <ul>...</ul>;
}

function Component() {
  return (
    <div>
      <Items />
    </div>
  );
}
```

#### Stay consistent

Keep your code style consistent. For example, if you name your components using pascal case, do it everywhere. Most of code consistency is achieved by using linters and code formatters, so make sure you have them set up in your project.

#### Limit the number of props a component is accepting as input

If your component is accepting too many props you might consider splitting it into multiple components or use the composition technique via children or slots.

[Composition Example Code](../apps/react-vite/src/components/ui/dialog/confirmation-dialog/confirmation-dialog.tsx)

#### Abstract shared components into a component library

For larger projects, it is a good idea to build abstractions around all the shared components. It makes the application more consistent and easier to maintain. Identify repetitions before creating the components to avoid wrong abstractions.

[Component Library Example Code](../apps/react-vite/src/components/ui/button/button.tsx)

It is a good idea to wrap 3rd party components as well in order to adapt them to the application's needs. It might be easier to make the underlying changes in the future without affecting the application's functionality.

[3rd Party Component Example Code](../apps/react-vite/src/components/ui/link/link.tsx)

## Component libraries

Every project requires some UI components such as modals, tabs, sidebars, menus, etc. Instead of building those from scratch, you might want to use some of the existing, battle-tested component libraries.

#### Fully featured component libraries:

These component libraries come with their components fully styled.

- [Chakra UI](https://chakra-ui.com/) - great library with great developer experience, allows very fast prototyping with decent design defaults. Plenty of components that are very customizable and flexible with accessibility already configured out of the box.

- [AntD](https://ant.design/) - another great component library that has a lot of different components. Best suitable for creating admin dashboards. However, it might be a bit difficult to change the styles in order to adapt them to a custom design.

- [MUI](https://mui.com/material-ui/) - the most popular component library for React. Has a lot of different components. Can be used as a styled solution by implementing Material Design or as unstyled headless component library.

- [Mantine](https://mantine.dev/) - a modern react component library with a lot of components and hooks. It is very customizable and has a lot of features out of the box.

#### Headless component libraries:

These component libraries come with their components unstyled. If you have a specific design system to implement, it might be easier and better solution to go with headless components that come unstyled than to adapt a fully featured component library such as Material UI to your needs. Some good options are:

- [Radix UI](https://www.radix-ui.com/)
- [Headless UI](https://headlessui.dev/)
- [react-aria](https://react-spectrum.adobe.com/react-aria/)
- [Ark UI](https://ark-ui.com/)
- [Reakit](https://reakit.io/)

## Styling Solutions

There are multiple ways to style a react application. Some good options are:

- [tailwind](https://tailwindcss.com/)
- [vanilla-extract](https://github.com/seek-oss/vanilla-extract)
- [Panda CSS](https://panda-css.com/)
- [CSS modules](https://github.com/css-modules/css-modules)
- [styled-components](https://styled-components.com/)
- [emotion](https://emotion.sh/docs/introduction)

NOTE: Keep React Server Components in mind as they require zero runtime styling solution.

With the rise of headless component libraries, there is another tier of component libraries where predefined components are provided with styling solutions included, but instead of being installed as a package, they are provided as code which can be customized and styled as needed.

- [ShadCN UI](https://ui.shadcn.com/)
- [Park UI](https://park-ui.com/)

## Storybook

[Storybook](https://storybook.js.org/) is a great tool for developing and testing components in isolation. Think of it as a catalogue of all the components your application is using. Very useful for developing and discoverability of components.

[Storybook Story Example Code](../apps/react-vite/src/components/ui/button/button.stories.tsx)

# ⚡ React Query Style Guide

This project uses [TanStack Query (React Query)](https://tanstack.com/query/latest) for all asynchronous data fetching and mutations. Follow these conventions for consistency and maintainability:

---

## Queries

A query is a declarative dependency on an async data source, tied to a **unique key**. Use the `useQuery` hook with:
- A **unique query key** (array)
- A function returning a promise (your fetcher)

```tsx
import { useQuery } from '@tanstack/react-query'

function App() {
  const info = useQuery({ queryKey: ['todos'], queryFn: fetchTodoList })
}
```

The query result contains all states you need:
- `isPending` or `status === 'pending'`
- `isError` or `status === 'error'`
- `isSuccess` or `status === 'success'`
- `error`, `data`, `isFetching`

Typical usage:
```tsx
function Todos() {
  const { isPending, isError, data, error } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodoList,
  })

  if (isPending) return <span>Loading...</span>
  if (isError) return <span>Error: {error.message}</span>
  return <ul>{data.map((todo) => <li key={todo.id}>{todo.title}</li>)}</ul>
}
```

You can also use the `status` field:
```tsx
function Todos() {
  const { status, data, error } = useQuery({ queryKey: ['todos'], queryFn: fetchTodoList })
  if (status === 'pending') return <span>Loading...</span>
  if (status === 'error') return <span>Error: {error.message}</span>
  return <ul>{data.map((todo) => <li key={todo.id}>{todo.title}</li>)}</ul>
}
```

### FetchStatus
- `fetchStatus === 'fetching'` - Query is fetching
- `fetchStatus === 'paused'` - Query is paused (e.g., offline)
- `fetchStatus === 'idle'` - Query is idle

- `status` describes the data state
- `fetchStatus` describes the network/fetch state

---

## Mutations

Use `useMutation` for create/update/delete or side-effect actions:
```tsx
const mutation = useMutation({
  mutationFn: (newTodo) => axios.post('/todos', newTodo),
})

mutation.mutate({ id: 1, title: 'Do Laundry' })
```

Mutation states:
- `isIdle` or `status === 'idle'`
- `isPending` or `status === 'pending'`
- `isError` or `status === 'error'`
- `isSuccess` or `status === 'success'`

You can pass callbacks to `mutate` or use `onSuccess`, `onError`, `onSettled` in the hook options.

```tsx
const mutation = useMutation({
  mutationFn: addTodo,
  onSuccess: () => queryClient.invalidateQueries(['todos'])
})
```

For async/await, use `mutateAsync`:
```tsx
await mutation.mutateAsync({ title: 'New Todo' })
```

---

## Patterns
- Always colocate queries/mutations with the feature/component using them
- Use query keys that reflect the resource and parameters
- Use query key factories for consistency (e.g., `queryKey: todoKeys.list()`)
- Use `onSuccess`/`onError` for side effects (e.g., cache invalidation)
- Prefer feature-based folders for hooks and API logic
- Document custom hooks and query key factories

---

For more, see the [TanStack Query docs](https://tanstack.com/query/latest/docs/react/overview) and [API contract](./api-v2.md).

# 📑 API Contract

For all backend integration and data shape details, refer to [API v2 documentation](./api-v2.md). All transaction and projected transaction features must follow the contract and endpoints described there. This ensures the frontend remains in sync with the backend and supports maintainable, robust integration.

# 📁 Folder Structure & Logical Flow

For guidance on how to organize features, components, API logic, and documentation, see [folder-structure.md](./folder-structure.md). Follow the patterns and principles described there to ensure a scalable, maintainable, and repeatable project structure.

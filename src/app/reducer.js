export const initialState = {
  username: null,
  color: 'red',
};

export function reducer(state, action) {
  const { type } = action;

  switch (type) {
    case 'setUsername': {
      const username = action.value;
      window.localStorage.setItem('username', JSON.stringify(username));
      return { ...state, username };
    }
    case 'setColor': {
      const color = action.value;
      window.localStorage.setItem('color', JSON.stringify(color));
      return { ...state, color };
    }
    default:
      throw new Error();
  }
}

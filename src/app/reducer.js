export const initialState = {
  username: null,
  color: null,
};

export function reducer(state, action) {
  const { type, value } = action;

  switch (type) {
    case 'setUsername':
      return { ...state, username: value };
    case 'setColor': {
      return { ...state, color: value };
    }
    default:
      throw new Error();
  }
}

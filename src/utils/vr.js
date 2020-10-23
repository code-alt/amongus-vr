/**
 * Returns true if being rendererd in a VR session.
 */
const vr = renderer => 'xr' in navigator && (renderer.xr && renderer.xr.getSession())
export default vr

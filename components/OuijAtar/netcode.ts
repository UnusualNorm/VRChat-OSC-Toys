import io from 'socket.io-client';

const socket = io('/OuijAtar');

const syncPosition = (position: [number, number]) => 
  socket.emit('syncPosition', position);

const onPositionChange = (callback: (position: [number, number]) => void) => 
  socket.on('syncPosition', callback);

const takeFocus = () => socket.emit('changeFocus');

const onFocusChange = (callback: (focuser: string, isSelf: boolean) => void) =>
  socket.on('changeFocus', (focuser: string) =>
    callback(focuser, focuser == socket.id));

export { syncPosition, onPositionChange, takeFocus, onFocusChange };
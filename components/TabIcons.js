import React from 'react';
import { View, StyleSheet } from 'react-native';

export const HomeIcon = ({ color, size = 24 }) => {
  const scale = size / 24;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Roof */}
      <View style={[styles.homeRoof, {
        borderBottomWidth: 12 * scale,
        borderLeftWidth: 12 * scale,
        borderRightWidth: 12 * scale,
        borderBottomColor: color,
        top: -2 * scale
      }]} />
      {/* House body */}
      <View style={[styles.homeBody, {
        width: 16 * scale,
        height: 14 * scale,
        borderColor: color,
        borderWidth: 2 * scale,
        bottom: -1 * scale
      }]}>
        {/* Door */}
        <View style={[styles.homeDoor, {
          width: 6 * scale,
          height: 8 * scale,
          backgroundColor: color,
          bottom: 0
        }]} />
      </View>
    </View>
  );
};

export const GamesIcon = ({ color, size = 24 }) => {
  const scale = size / 24;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Controller body */}
      <View style={[styles.gameController, {
        width: 20 * scale,
        height: 12 * scale,
        borderColor: color,
        borderWidth: 2 * scale,
        borderRadius: 4 * scale
      }]}>
        {/* D-pad */}
        <View style={{ position: 'absolute', left: 4 * scale, top: 3 * scale }}>
          <View style={{
            width: 6 * scale,
            height: 2 * scale,
            backgroundColor: color
          }} />
          <View style={{
            width: 2 * scale,
            height: 6 * scale,
            backgroundColor: color,
            position: 'absolute',
            left: 2 * scale,
            top: -2 * scale
          }} />
        </View>
        {/* Buttons */}
        <View style={{ position: 'absolute', right: 4 * scale, top: 3 * scale }}>
          <View style={{
            width: 2.5 * scale,
            height: 2.5 * scale,
            borderRadius: 1.25 * scale,
            backgroundColor: color,
            marginBottom: 1 * scale
          }} />
          <View style={{
            width: 2.5 * scale,
            height: 2.5 * scale,
            borderRadius: 1.25 * scale,
            backgroundColor: color,
            position: 'absolute',
            left: 3 * scale
          }} />
        </View>
      </View>
    </View>
  );
};

export const DownloadIcon = ({ color, size = 24 }) => {
  const scale = size / 24;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Arrow shaft */}
      <View style={[styles.downloadShaft, {
        width: 2 * scale,
        height: 12 * scale,
        backgroundColor: color,
        top: -2 * scale
      }]} />
      {/* Arrow head */}
      <View style={[styles.downloadArrow, {
        borderTopWidth: 6 * scale,
        borderLeftWidth: 6 * scale,
        borderRightWidth: 6 * scale,
        borderTopColor: color,
        top: 6 * scale
      }]} />
      {/* Base line */}
      <View style={[styles.downloadBase, {
        width: 16 * scale,
        height: 2 * scale,
        backgroundColor: color,
        top: 10 * scale
      }]} />
    </View>
  );
};

export const WindowIcon = ({ color, size = 24 }) => {
  const scale = size / 24;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Window frame */}
      <View style={[styles.windowFrame, {
        width: 18 * scale,
        height: 16 * scale,
        borderColor: color,
        borderWidth: 2 * scale,
        borderRadius: 3 * scale
      }]}>
        {/* Top bar */}
        <View style={{
          width: '100%',
          height: 2 * scale,
          backgroundColor: color,
          position: 'absolute',
          top: 3 * scale
        }} />
        {/* Lines */}
        <View style={{
          width: 10 * scale,
          height: 2 * scale,
          backgroundColor: color,
          position: 'absolute',
          left: 2 * scale,
          top: 7 * scale
        }} />
        <View style={{
          width: 7 * scale,
          height: 2 * scale,
          backgroundColor: color,
          position: 'absolute',
          left: 2 * scale,
          top: 10 * scale
        }} />
      </View>
    </View>
  );
};

export const ProfileIcon = ({ color, size = 24 }) => {
  const scale = size / 24;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Head */}
      <View style={[styles.profileHead, {
        width: 8 * scale,
        height: 8 * scale,
        borderRadius: 4 * scale,
        borderColor: color,
        borderWidth: 2 * scale,
        top: -2 * scale
      }]} />
      {/* Body */}
      <View style={[styles.profileBody, {
        width: 14 * scale,
        height: 8 * scale,
        borderColor: color,
        borderWidth: 2 * scale,
        borderRadius: 7 * scale,
        borderTopLeftRadius: 7 * scale,
        borderTopRightRadius: 7 * scale,
        top: 2 * scale,
        borderBottomWidth: 0
      }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  homeRoof: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    position: 'absolute',
  },
  homeBody: {
    position: 'absolute',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  homeDoor: {
    position: 'absolute',
  },
  gameController: {
    position: 'relative',
  },
  downloadShaft: {
    position: 'absolute',
  },
  downloadArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    position: 'absolute',
  },
  downloadBase: {
    position: 'absolute',
  },
  windowFrame: {
    position: 'relative',
  },
  profileHead: {
    position: 'absolute',
  },
  profileBody: {
    position: 'absolute',
  },
});

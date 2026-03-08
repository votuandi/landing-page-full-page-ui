/**
 * Utility functions for sharing content to social media platforms
 */

/**
 * Opens Facebook share dialog in a new window with the current page URL
 */
export const handleShareToFacebook = () => {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const encodedUrl = encodeURIComponent(currentUrl);
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  
  // Open Facebook share dialog in a new window
  window.open(
    facebookShareUrl,
    'facebook-share-dialog',
    'width=600,height=400,menubar=no,toolbar=no,resizable=yes,scrollbars=yes'
  );
};
